/*
 * Product    : AQUILA-CMS
 * Author     : Nextsourcia - contact@aquila-cms.com
 * Copyright  : 2021 © Nextsourcia - All rights reserved.
 * License    : Open Software License (OSL 3.0) - https://opensource.org/licenses/OSL-3.0
 * Disclaimer : Do not edit or add to this file if you wish to upgrade AQUILA CMS to newer versions in the future.
 */

const packageManager    = require('aql-utils');
const mongoose          = require('./database').connect;
const logger            = require('./logger');
const captchaValidation = require('./captchaValidation');
const encryption        = require('./encryption');
const modules           = require('./modules');
const translation       = require('./translation');
const utils             = require('./utils');
const serverUtils       = require('./server');
const QueryBuilder      = require('./QueryBuilder');
const CacheService      = require('./CacheService');
const NSError           = require('./errors/NSError');
const NSErrors          = require('./errors/NSErrors');

module.exports = {
    mongoose,
    logger,
    captchaValidation,
    encryption,
    modules,
    packageManager,
    translation,
    utils,
    serverUtils,
    QueryBuilder,
    CacheService,
    NSError,
    NSErrors
};