# Changelog

## [1.8.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.7.3...v1.8.0) (2026-02-09)


### Features

* **contact:** enhance contact creation and update expressions for improved value resolution ([aa117f6](https://github.com/immoJUMP/n8n-nodes-immojump/commit/aa117f6327b8b6d706e74b6408cb2a100bce3df7))


### Bug Fixes

* **alphabetic_linting_error:** now the linting test should succed cause of correct sorted points ([9ca2798](https://github.com/immoJUMP/n8n-nodes-immojump/commit/9ca2798579d41e46b6773ae9133c802c48be95f2))

## [1.7.3](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.7.2...v1.7.3) (2026-01-13)


### Bug Fixes

* **n8n-nodes-immojumo:** fixed that for the creation of a contact the System takes the information by the Credential ([42b033c](https://github.com/immoJUMP/n8n-nodes-immojump/commit/42b033c6e094bc6f69f76b660c797cdc57c07d68))

## [1.7.2](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.7.1...v1.7.2) (2026-01-08)


### Bug Fixes

* **n8n-nodes-immojumo:** fixed the update property event ([6707f8a](https://github.com/immoJUMP/n8n-nodes-immojump/commit/6707f8aa6cb38e737d088ea08f1a64b8e29c5062))

## [1.7.1](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.7.0...v1.7.1) (2025-12-29)


### Bug Fixes

* **ImmoJumpApiCredentials.ts:** Changed the Base URL ([811ff1d](https://github.com/immoJUMP/n8n-nodes-immojump/commit/811ff1d3ec9a51b7c5e030b0c30250886ab30810))
* **n8n-nodes-immojump:** fixed some events ([0885bd3](https://github.com/immoJUMP/n8n-nodes-immojump/commit/0885bd300dbc08b79c7ba8a7c8e62a7f0ebdb99b))
* **n8n-nodes-immojump:** Fixed the Linting Errors ([214ead5](https://github.com/immoJUMP/n8n-nodes-immojump/commit/214ead5ba058bd3a89052922349bc8ef40ff4441))
* **n8n-nodes-immojump:** smaller bugs ([5832fef](https://github.com/immoJUMP/n8n-nodes-immojump/commit/5832feff2f62b1bc7b6c14e0d1465a91de951c98))
* **n8n-nodes-immojump:** smaller bugs ([281622a](https://github.com/immoJUMP/n8n-nodes-immojump/commit/281622a5b8a7f9ee0efebb5804a6aaa6ce2995f2))

## [1.7.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.6.0...v1.7.0) (2025-10-08)


### Features

* add support for contact, activity ([c222f12](https://github.com/immoJUMP/n8n-nodes-immojump/commit/c222f121307100843cf0b6e47e92df0c1d7f7774))

## [1.6.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.5.0...v1.6.0) (2025-10-07)


### Features

* add links support ([95712a0](https://github.com/immoJUMP/n8n-nodes-immojump/commit/95712a0b4970fadfa4861b5c2a47c9b0d632dc2b))

## [1.5.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.4.0...v1.5.0) (2025-10-07)


### Features

* add pagination and stats to home views with updated database config ([372dcef](https://github.com/immoJUMP/n8n-nodes-immojump/commit/372dcef1a43d453bdadc962fb295914fac8baf1e))

## [1.4.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.3.0...v1.4.0) (2025-10-06)


### Features

* remove unused user and company resources from Immojump node ([afb1e88](https://github.com/immoJUMP/n8n-nodes-immojump/commit/afb1e88f91569aed52b7a743e75b775369b44bc7))

## [1.3.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.2.0...v1.3.0) (2025-10-06)


### Features

* add pagination and stats to home views with updated database config ([5a406be](https://github.com/immoJUMP/n8n-nodes-immojump/commit/5a406be4b7eae343b594e6df5637e91da4d04690))

## [1.2.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.1.0...v1.2.0) (2025-10-06)


### Features

* add pagination and stats to home views with updated database config ([68142e0](https://github.com/immoJUMP/n8n-nodes-immojump/commit/68142e09b07f91853c4bed059a06158209340413))
* add pagination and stats to property views with total price aggregation ([13be536](https://github.com/immoJUMP/n8n-nodes-immojump/commit/13be536eacc6293f03fe7ff73207fc869b6a7bd7))

## [1.1.0](https://github.com/immoJUMP/n8n-nodes-immojump/compare/v1.0.0...v1.1.0) (2025-09-26)

### Features

* **docs**: improve documentation and configuration ([6f7fa30](https://github.com/immoJUMP/n8n-nodes-immojump/commit/6f7fa30))
  - Enhanced documentation with ImmoJUMP API references
  - Configured environment variables for production deployment
  - Updated GitHub workflow for better CI/CD pipeline

## 1.0.0 (2025-09-26)

### Features

* **core**: add ImmoJUMP n8n integration capabilities ([ac254e3](https://github.com/immoJUMP/n8n-nodes-immojump/commit/ac254e3))
  - Initial release of n8n-nodes-immojump package
  - Add `updateStatus` and `setTags` operations ([d62f66d](https://github.com/immoJUMP/n8n-nodes-immojump/commit/d62f66d))
  - Implement new API schema support ([0a75cac](https://github.com/immoJUMP/n8n-nodes-immojump/commit/0a75cac))
  - Configure GitHub workflow for automated releases ([2394e6a](https://github.com/immoJUMP/n8n-nodes-immojump/commit/2394e6a))

### Bug Fixes

* **backend**: ensure proper status blueprint registration ([929650c](https://github.com/immoJUMP/n8n-nodes-immojump/commit/929650c))
