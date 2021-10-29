/*
 * Product    : AQUILA-CMS
 * Author     : Nextsourcia - contact@aquila-cms.com
 * Copyright  : 2021 © Nextsourcia - All rights reserved.
 * License    : Open Software License (OSL 3.0) - https://opensource.org/licenses/OSL-3.0
 * Disclaimer : Do not edit or add to this file if you wish to upgrade AQUILA CMS to newer versions in the future.
 */

const axios                    = require('axios');
const AdmZip                   = require('adm-zip');
const path                     = require('path');
const fsp                      = require('aql-utils');
const packageManager           = require('aql-utils');
const {isProd}                 = require('../utils/server');
const {Modules, Configuration} = require('../orm/models');
const tmpPath                  = path.resolve('./uploads/temp');

/**
 * Compare local version with distant version
 */
const verifyingUpdate = async () => {
    const actualVersion = JSON.parse(fsp.readFileSync(path.resolve(global.appRoot, './package.json'))).version;

    // Create the /uploads/temp folder if it doesn't exist
    if (!fsp.existsSync(tmpPath)) {
        fsp.mkdirSync(tmpPath, {recursive: true});
    }

    // Get online version
    const fileURL  = 'https://last-aquila.s3-eu-west-1.amazonaws.com/version.txt';
    const filePath = path.resolve(`${tmpPath}/version.txt`);
    let onlineVersion;
    try {
        await downloadURL(fileURL, filePath);
        onlineVersion = fsp.readFileSync(filePath).toString().replace('\n', '').trim();
    } catch (exc) {
        console.error(`Get ${fileURL} failed`);
    }
    return {
        version    : actualVersion,
        onlineVersion,
        needUpdate : actualVersion < onlineVersion
    };
};

async function checkChanges() {
    const status = await packageManager.execCmd('git status -uno');
    console.log(status);
    if (status.stderr !== '') {
        return {type: 'error', message: status.stderr};
    }
    return {message: status.stdout};
}

const updateGithub = async () => {
    await setMaintenance(true);
    try {
        await packageManager.execCmd('git reset --hard');
        await packageManager.execCmd('git clean -fd');
        await packageManager.execCmd('git pull');
        await setMaintenance(false);
        console.log('Aquila is updated !');
        return packageManager.restart();
    } catch (error) {
        console.error(error);
        return error;
    }
};

const update = async () => {
    console.log('Update Aquila...');

    await setMaintenance(true);

    const filePathV = path.resolve(`${tmpPath}/version.txt`);
    const version   = fsp.readFileSync(filePathV).toString().replace('\n', '').trim();

    const fileURL  = `https://last-aquila.s3-eu-west-1.amazonaws.com/Aquila-${version}.zip`;
    const filePath = `${tmpPath}//Aquila-${version}.zip`;
    let aquilaPath = './';

    const devMode = global.envFile.devMode;
    if (typeof devMode !== 'undefined') {
        aquilaPath = tmpPath;
    }

    // Download the file
    try {
        console.log(`Downloading Aquila ${version}...`);
        await downloadURL(fileURL, filePath);
    } catch (exc) {
        console.error(`Get ${fileURL} failed`);
    }

    // Unzip temporary folder
    try {
        console.log('Extracting archive...');
        const zip = new AdmZip(filePath);
        zip.extractAllTo(aquilaPath, true);
    } catch (exc) {
        console.error(`Unzip ${filePath} failed`);
    }

    // yarn install du aquila
    await packageManager.execCmd(`yarn install${isProd ? ' --prod' : ''}`);
    const modules = await Modules.find({active: true});

    for (const module of modules) {
        if (module.packageDependencies && module.packageDependencies.api && module.packageDependencies.api.length > 0) {
            await packageManager.execCmd(`yarn add ${module.packageDependencies.api.join(' ')}`);
        }
    }

    await fsp.unlink(filePath);
    await setMaintenance(false);

    console.log('Aquila is updated !');
    // Reboot
    return packageManager.restart();
};

/**
 * Download file from url to destination folder
 * @param {String | Buffer | URL} url
 * @param {String Buffer | | URL} dest
 */
async function downloadURL(url, dest) {
    const request = await axios({
        url,
        method       : 'GET',
        responseType : 'stream'
    });
    const file    = fsp.createWriteStream(dest);
    request.data.pipe(file);
    return new Promise((resolve, reject) => {
        file.on('finish', () => {
            file.close();
            resolve();
        });
        request.data.on('error', async (err) => {
            await fsp.unlink(dest);
            return reject(err);
        });
    });
}

/**
 * Set in maintenance mode (no front is delivered)
 * @param {boolean} isInMaintenance Maintenance status to set
 */
const setMaintenance = async (isInMaintenance) =>  {
    const configuration = await Configuration.findOne({});

    if (configuration && configuration.environment && configuration.environment.autoMaintenance) {
        configuration.environment.maintenance = isInMaintenance;
        await configuration.save();
    }
};

const checkGithub = async () => {
    const git = {
        exist : false
    };
    if (fsp.existsSync(path.resolve('./.git'), {recursive: true})) {
        git.exist = true;
    }
    return git;
};

module.exports = {
    verifyingUpdate,
    update,
    setMaintenance,
    checkGithub,
    updateGithub,
    checkChanges
};
