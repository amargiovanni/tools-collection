// App initialization and management
class OnlineToolsApp {
    constructor() {
        this.currentTool = null;
        this.currentView = 'home';
        this.supportedLanguages = ['en', 'it'];
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;
        this.messages = {};
        this.init();
    }

    init() {
        console.log('Initializing Online Tools App');
        this.initLanguage();
        this.initTheme();
        this.initNavigation();
        this.initMobileMenu();
        this.initSearch();
        this.initTools();
        this.initRouting();
        this.initHomeButton();
        this.renderHomeCatalog();

        const initialTool = this.getInitialTool();
        if (initialTool) {
            this.switchTool(initialTool, { updateHash: false });
        } else {
            this.showHome({ updateHash: false });
        }
    }

    // Language Management
    initLanguage() {
        const langToggle = document.getElementById('langToggle');
        const savedLang = localStorage.getItem('language');
        const browserLang = (navigator.language.split('-')[0] || this.defaultLanguage).toLowerCase();
        const initialLang = this.supportedLanguages.includes(savedLang)
            ? savedLang
            : (this.supportedLanguages.includes(browserLang) ? browserLang : this.defaultLanguage);

        const applyTranslations = (messages) => {
            this.messages = messages;
            this.applySelectorTranslations();
            this.renderHomeCatalog();

            document.documentElement.lang = this.currentLanguage;
            document.title = this.t('app.documentTitle', 'Tools Collection');
            const homeToggle = document.getElementById('homeToggle');
            if (langToggle) {
                langToggle.textContent = this.currentLanguage.toUpperCase();
                langToggle.setAttribute('aria-label', this.t('app.switchLanguageAria', 'Switch language'));
                langToggle.title = this.t('app.switchLanguageTitle', 'Switch language');
            }
            if (homeToggle) {
                homeToggle.setAttribute('aria-label', this.t('app.backHomeAria', 'Back to home'));
                homeToggle.title = this.t('app.backHomeTitle', 'Back to home');
            }
        };

        const loadLocale = (code) => {
            fetch(`locales/${code}.json`)
                .then(res => res.json())
                .then(data => {
                    this.currentLanguage = code;
                    applyTranslations(data);
                })
                .catch(err => {
                    if (code !== this.defaultLanguage) {
                        console.log(`Falling back to ${this.defaultLanguage}`);
                        loadLocale(this.defaultLanguage);
                    } else {
                        console.error('Failed to load translations', err);
                    }
                });
        };

        if (langToggle) {
            langToggle.addEventListener('click', () => {
                const nextLang = this.currentLanguage === 'en' ? 'it' : 'en';
                localStorage.setItem('language', nextLang);
                loadLocale(nextLang);
            });
        }

        loadLocale(initialLang);
    }

    t(key, fallback = '') {
        return this.messages[key] || fallback;
    }

    getTranslationBindings() {
        return [
            { selector: '.mobile-menu-toggle', key: 'app.mobileMenuAria', attr: 'aria-label' },
            { selector: '.sidebar-header h1', key: 'app.title' },
            { selector: '.sidebar-header p', key: 'app.description' },
            { selector: '#searchInput', key: 'app.searchPlaceholder', attr: 'placeholder' },
            { selector: '#homeView .home-eyebrow', key: 'home.eyebrow' },
            { selector: '#homeView .home-hero h1', key: 'home.title' },
            { selector: '#homeView .home-hero p', key: 'home.description' },

            { selector: '.tool-category:nth-of-type(1) h3', key: 'sidebar.textProcessing' },
            { selector: '.tool-category:nth-of-type(2) h3', key: 'sidebar.generators' },
            { selector: '.tool-category:nth-of-type(3) h3', key: 'sidebar.extraction' },
            { selector: '.tool-category:nth-of-type(4) h3', key: 'sidebar.analysis' },
            { selector: '.tool-category:nth-of-type(5) h3', key: 'sidebar.security' },
            { selector: '.tool-category:nth-of-type(6) h3', key: 'sidebar.converters' },
            { selector: '.tool-category:nth-of-type(7) h3', key: 'sidebar.development' },
            { selector: '.tool-category:nth-of-type(8) h3', key: 'sidebar.utilities' },

            { selector: '[data-tool="list-generator"]', key: 'nav.listGenerator' },
            { selector: '[data-tool="add-text-lines"]', key: 'nav.addTextLines' },
            { selector: '[data-tool="convert-case"]', key: 'nav.convertCase' },
            { selector: '[data-tool="remove-duplicates"]', key: 'nav.removeDuplicates' },
            { selector: '[data-tool="remove-line-breaks"]', key: 'nav.removeLineBreaks' },
            { selector: '[data-tool="remove-lines-containing"]', key: 'nav.removeLinesContaining' },
            { selector: '[data-tool="password-generator"]', key: 'nav.passwordGenerator' },
            { selector: '[data-tool="username-generator"]', key: 'nav.usernameGenerator' },
            { selector: '[data-tool="domain-extractor"]', key: 'nav.domainExtractor' },
            { selector: '[data-tool="email-extractor"]', key: 'nav.emailExtractor' },
            { selector: '[data-tool="count-duplicates"]', key: 'nav.countDuplicates' },
            { selector: '[data-tool="cert-extractor"]', key: 'nav.certExtractor' },
            { selector: '[data-tool="password-checker"]', key: 'nav.passwordChecker' },
            { selector: '[data-tool="qr-generator"]', key: 'nav.qrGenerator' },
            { selector: '[data-tool="emoji-converter"]', key: 'nav.emojiConverter' },
            { selector: '[data-tool="base64-converter"]', key: 'nav.base64Converter' },
            { selector: '[data-tool="url-encoder"]', key: 'nav.urlEncoder' },
            { selector: '[data-tool="json-formatter"]', key: 'nav.jsonFormatter' },
            { selector: '[data-tool="diff-checker"]', key: 'nav.diffChecker' },
            { selector: '[data-tool="regex-tester"]', key: 'nav.regexTester' },
            { selector: '[data-tool="xml-beautifier"]', key: 'nav.xmlBeautifier' },
            { selector: '[data-tool="color-picker"]', key: 'nav.colorPicker' },
            { selector: '[data-tool="timestamp-converter"]', key: 'nav.timestampConverter' },
            { selector: '[data-tool="hash-generator"]', key: 'nav.hashGenerator' },

            { selector: '#list-generator .tool-header h2', key: 'list.title' },
            { selector: '#list-generator .tool-header p', key: 'list.description' },
            { selector: '#list-generator .input-section .form-label', key: 'common.inputText' },
            { selector: '#listInput', key: 'list.placeholder', attr: 'placeholder' },
            { selector: '#list-generator .options-section h4', key: 'list.outputFormat' },
            { selector: '#list-generator [data-format="numbered"]', key: 'list.formatNumbered' },
            { selector: '#list-generator [data-format="bulleted"]', key: 'list.formatBulleted' },
            { selector: '#list-generator [data-format="comma"]', key: 'list.formatComma' },
            { selector: '#list-generator [data-format="pipe"]', key: 'list.formatPipe' },
            { selector: '#list-generator .output-section .form-label', key: 'common.result' },

            { selector: '#password-generator .tool-header h2', key: 'passwordGenerator.title' },
            { selector: '#password-generator .tool-header p', key: 'passwordGenerator.description' },
            { selector: '#password-generator .setting-item:nth-of-type(1) .form-label', key: 'passwordGenerator.lengthLabel', type: 'textNode', trailingSpace: true },
            { selector: '#password-generator .setting-item:nth-of-type(2) .form-label', key: 'passwordGenerator.countLabel' },
            { selector: '#password-generator .setting-item:nth-of-type(3) label', key: 'passwordGenerator.includeUppercase', type: 'textNode', leadingSpace: true },
            { selector: '#password-generator .setting-item:nth-of-type(4) label', key: 'passwordGenerator.includeLowercase', type: 'textNode', leadingSpace: true },
            { selector: '#password-generator .setting-item:nth-of-type(5) label', key: 'passwordGenerator.includeNumbers', type: 'textNode', leadingSpace: true },
            { selector: '#password-generator .setting-item:nth-of-type(6) label', key: 'passwordGenerator.includeSymbols', type: 'textNode', leadingSpace: true },
            { selector: '#generatePassword', key: 'passwordGenerator.generate' },
            { selector: '#passwordResultsHeader .form-label', key: 'passwordGenerator.outputLabel' },
            { selector: '#copyAllPasswords', key: 'passwordGenerator.copyAll' },

            { selector: '#username-generator .tool-header h2', key: 'username.title' },
            { selector: '#username-generator .tool-header p', key: 'username.description' },
            { selector: '#username-generator .setting-item:nth-of-type(1) .form-label', key: 'username.style' },
            { selector: '#usernameStyle option[value="random"]', key: 'username.styleRandom' },
            { selector: '#usernameStyle option[value="tech"]', key: 'username.styleTech' },
            { selector: '#usernameStyle option[value="fantasy"]', key: 'username.styleFantasy' },
            { selector: '#usernameStyle option[value="cool"]', key: 'username.styleCool' },
            { selector: '#username-generator .setting-item:nth-of-type(2) .form-label', key: 'username.count' },
            { selector: '#generateUsernames', key: 'username.generate' },
            { selector: '#usernameResultsHeader .form-label', key: 'username.outputLabel' },
            { selector: '#copyAllUsernames', key: 'username.copyAll' },

            { selector: '#add-text-lines .tool-header h2', key: 'addText.title' },
            { selector: '#add-text-lines .tool-header p', key: 'addText.description' },
            { selector: '#add-text-lines .input-section .form-label', key: 'addText.originalText' },
            { selector: '#originalText', key: 'common.inputPlaceholder', attr: 'placeholder' },
            { selector: '#add-text-lines .setting-item:nth-of-type(1) .form-label', key: 'addText.textToAdd' },
            { selector: '#textToAdd', key: 'addText.additionPlaceholder', attr: 'placeholder' },
            { selector: '#add-text-lines .setting-item:nth-of-type(2) label:nth-of-type(1)', key: 'addText.positionStart', type: 'textNode', leadingSpace: true },
            { selector: '#add-text-lines .setting-item:nth-of-type(2) label:nth-of-type(2)', key: 'addText.positionEnd', type: 'textNode', leadingSpace: true },
            { selector: '#add-text-lines .output-section .form-label', key: 'common.result' },

            { selector: '#convert-case .tool-header h2', key: 'case.title' },
            { selector: '#convert-case .tool-header p', key: 'case.description' },
            { selector: '#convert-case .input-section .form-label', key: 'common.inputText' },
            { selector: '#caseInput', key: 'common.inputPlaceholder', attr: 'placeholder' },
            { selector: '#convert-case [data-case="upper"]', key: 'case.upper' },
            { selector: '#convert-case [data-case="lower"]', key: 'case.lower' },
            { selector: '#convert-case [data-case="title"]', key: 'case.titleCase' },
            { selector: '#convert-case [data-case="camel"]', key: 'case.camel' },
            { selector: '#convert-case [data-case="snake"]', key: 'case.snake' },
            { selector: '#convert-case [data-case="constant"]', key: 'case.constant' },
            { selector: '#convert-case .output-section .form-label', key: 'common.result' },

            { selector: '#count-duplicates .tool-header h2', key: 'duplicates.title' },
            { selector: '#count-duplicates .tool-header p', key: 'duplicates.description' },
            { selector: '#count-duplicates .input-section .form-label', key: 'duplicates.inputLabel' },
            { selector: '#duplicateInput', key: 'duplicates.placeholder', attr: 'placeholder' },
            { selector: '#count-duplicates .options-section label:nth-of-type(1)', key: 'duplicates.sortByCount', type: 'textNode', leadingSpace: true },
            { selector: '#count-duplicates .options-section label:nth-of-type(2)', key: 'common.caseSensitive', type: 'textNode', leadingSpace: true },
            { selector: '#analyzeDuplicates', key: 'duplicates.analyze' },

            { selector: '#domain-extractor .tool-header h2', key: 'domain.title' },
            { selector: '#domain-extractor .tool-header p', key: 'domain.description' },
            { selector: '#domain-extractor .input-section .form-label', key: 'domain.inputLabel' },
            { selector: '#domainInput', key: 'domain.placeholder', attr: 'placeholder' },
            { selector: '#domain-extractor .options-section label', key: 'domain.includeSubdomains', type: 'textNode', leadingSpace: true },
            { selector: '#extractDomains', key: 'domain.extract' },
            { selector: '#domain-extractor .output-section .form-label', key: 'domain.outputLabel' },

            { selector: '#remove-duplicates .tool-header h2', key: 'removeDuplicates.title' },
            { selector: '#remove-duplicates .tool-header p', key: 'removeDuplicates.description' },
            { selector: '#remove-duplicates .input-section .form-label', key: 'common.inputText' },
            { selector: '#removeDuplicatesInput', key: 'removeDuplicates.placeholder', attr: 'placeholder' },
            { selector: '#remove-duplicates .options-section label:nth-of-type(1)', key: 'removeDuplicates.preserveOrder', type: 'textNode', leadingSpace: true },
            { selector: '#remove-duplicates .options-section label:nth-of-type(2)', key: 'common.caseSensitive', type: 'textNode', leadingSpace: true },
            { selector: '#removeDuplicatesBtn', key: 'removeDuplicates.action' },
            { selector: '#remove-duplicates .output-section .form-label', key: 'common.result' },

            { selector: '#remove-line-breaks .tool-header h2', key: 'lineBreaks.title' },
            { selector: '#remove-line-breaks .tool-header p', key: 'lineBreaks.description' },
            { selector: '#remove-line-breaks .input-section .form-label', key: 'common.inputText' },
            { selector: '#lineBreaksInput', key: 'lineBreaks.placeholder', attr: 'placeholder' },
            { selector: '#remove-line-breaks .options-section h4', key: 'lineBreaks.replaceWith' },
            { selector: '#remove-line-breaks .replacement-options label:nth-of-type(1)', key: 'lineBreaks.space', type: 'textNode', leadingSpace: true },
            { selector: '#remove-line-breaks .replacement-options label:nth-of-type(2)', key: 'lineBreaks.nothing', type: 'textNode', leadingSpace: true },
            { selector: '#remove-line-breaks .replacement-options label:nth-of-type(3)', key: 'lineBreaks.custom', type: 'textNode', leadingSpace: true },
            { selector: '#removeLineBreaksBtn', key: 'lineBreaks.action' },
            { selector: '#remove-line-breaks .output-section .form-label', key: 'common.result' },

            { selector: '#remove-lines-containing .tool-header h2', key: 'removeContaining.title' },
            { selector: '#remove-lines-containing .tool-header p', key: 'removeContaining.description' },
            { selector: '#remove-lines-containing .input-section .form-label', key: 'common.inputText' },
            { selector: '#removeContainingInput', key: 'common.inputPlaceholder', attr: 'placeholder' },
            { selector: '#remove-lines-containing .setting-item .form-label', key: 'removeContaining.termsLabel' },
            { selector: '#wordsToRemove', key: 'removeContaining.termsPlaceholder', attr: 'placeholder' },
            { selector: '#remove-lines-containing .options-section > label', key: 'common.caseSensitive', type: 'textNode', leadingSpace: true },
            { selector: '#removeContainingBtn', key: 'removeContaining.action' },
            { selector: '#remove-lines-containing .output-section .form-label', key: 'common.result' },

            { selector: '#email-extractor .tool-header h2', key: 'email.title' },
            { selector: '#email-extractor .tool-header p', key: 'email.description' },
            { selector: '#email-extractor .input-section .form-label', key: 'common.inputText' },
            { selector: '#emailInput', key: 'email.placeholder', attr: 'placeholder' },
            { selector: '#email-extractor .options-section label', key: 'email.removeDuplicates', type: 'textNode', leadingSpace: true },
            { selector: '#extractEmailsBtn', key: 'email.extract' },
            { selector: '#email-extractor .output-section .form-label', key: 'email.outputLabel' },

            { selector: '#emoji-converter .tool-header h2', key: 'emoji.title' },
            { selector: '#emoji-converter .tool-header p', key: 'emoji.description' },
            { selector: '#emoji-converter .input-section .form-label', key: 'common.inputText' },
            { selector: '#emojiInput', key: 'emoji.placeholder', attr: 'placeholder' },
            { selector: '#convertToEmojiBtn', key: 'emoji.toEmoji' },
            { selector: '#convertToShortcodeBtn', key: 'emoji.toShortcode' },
            { selector: '#emoji-converter .emoji-reference h4', key: 'emoji.referenceTitle' },
            { selector: '#emoji-converter .output-section .form-label', key: 'common.result' },

            { selector: '#base64-converter .tool-header h2', key: 'base64.title' },
            { selector: '#base64-converter .tool-header p', key: 'base64.description' },
            { selector: '#base64-converter .input-section .form-label', key: 'common.inputText' },
            { selector: '#base64Input', key: 'base64.placeholder', attr: 'placeholder' },
            { selector: '#base64EncodeBtn', key: 'base64.encode' },
            { selector: '#base64DecodeBtn', key: 'base64.decode' },
            { selector: '#base64-converter .output-section .form-label', key: 'common.result' },

            { selector: '#url-encoder .tool-header h2', key: 'url.title' },
            { selector: '#url-encoder .tool-header p', key: 'url.description' },
            { selector: '#url-encoder .input-section .form-label', key: 'common.inputText' },
            { selector: '#urlInput', key: 'url.placeholder', attr: 'placeholder' },
            { selector: '#urlEncodeBtn', key: 'url.encode' },
            { selector: '#urlDecodeBtn', key: 'url.decode' },
            { selector: '#urlEncodeComponentBtn', key: 'url.encodeComponent' },
            { selector: '#url-encoder .output-section .form-label', key: 'common.result' },

            { selector: '#json-formatter .tool-header h2', key: 'json.title' },
            { selector: '#json-formatter .tool-header p', key: 'json.description' },
            { selector: '#json-formatter .input-section .form-label', key: 'json.inputLabel' },
            { selector: '#jsonInput', key: 'json.placeholder', attr: 'placeholder' },
            { selector: '#json-formatter .setting-item label:nth-of-type(1)', key: 'json.indent2', type: 'textNode', leadingSpace: true },
            { selector: '#json-formatter .setting-item label:nth-of-type(2)', key: 'json.indent4', type: 'textNode', leadingSpace: true },
            { selector: '#json-formatter .setting-item label:nth-of-type(3)', key: 'json.indentTab', type: 'textNode', leadingSpace: true },
            { selector: '#json-formatter .setting-item label:nth-of-type(4)', key: 'json.indentCompact', type: 'textNode', leadingSpace: true },
            { selector: '#formatJsonBtn', key: 'json.format' },
            { selector: '#json-formatter .output-section .form-label', key: 'json.outputLabel' },

            { selector: '#diff-checker .tool-header h2', key: 'diff.title' },
            { selector: '#diff-checker .tool-header p', key: 'diff.description' },
            { selector: '#diff-checker .input-section > div > div:nth-of-type(1) .form-label', key: 'diff.originalText' },
            { selector: '#diffText1', key: 'diff.originalPlaceholder', attr: 'placeholder' },
            { selector: '#diff-checker .input-section > div > div:nth-of-type(2) .form-label', key: 'diff.modifiedText' },
            { selector: '#diffText2', key: 'diff.modifiedPlaceholder', attr: 'placeholder' },
            { selector: '#diff-checker .options-section label:nth-of-type(1)', key: 'diff.ignoreCase', type: 'textNode', leadingSpace: true },
            { selector: '#diff-checker .options-section label:nth-of-type(2)', key: 'diff.ignoreWhitespace', type: 'textNode', leadingSpace: true },
            { selector: '#compareDiffBtn', key: 'diff.compare' },
            { selector: '#diff-checker .output-header .form-label', key: 'diff.outputLabel' },

            { selector: '#regex-tester .tool-header h2', key: 'regex.title' },
            { selector: '#regex-tester .tool-header p', key: 'regex.description' },
            { selector: '#regex-tester .input-section:nth-of-type(1) .form-label', key: 'regex.patternLabel' },
            { selector: '#regexPattern', key: 'regex.patternPlaceholder', attr: 'placeholder' },
            { selector: '#regex-tester .input-section:nth-of-type(1) label:nth-of-type(1)', key: 'regex.global', type: 'textNode', leadingSpace: true },
            { selector: '#regex-tester .input-section:nth-of-type(1) label:nth-of-type(2)', key: 'regex.ignoreCase', type: 'textNode', leadingSpace: true },
            { selector: '#regex-tester .input-section:nth-of-type(1) label:nth-of-type(3)', key: 'regex.multiline', type: 'textNode', leadingSpace: true },
            { selector: '#regex-tester .input-section:nth-of-type(2) .form-label', key: 'regex.testTextLabel' },
            { selector: '#regexInput', key: 'regex.testTextPlaceholder', attr: 'placeholder' },
            { selector: '#testRegexBtn', key: 'regex.test' },
            { selector: '#regex-tester .output-header .form-label', key: 'regex.outputLabel' },

            { selector: '#color-picker .tool-header h2', key: 'color.title' },
            { selector: '#color-picker .tool-header p', key: 'color.description' },
            { selector: '#color-picker .input-section .form-label', key: 'color.inputLabel' },
            { selector: '#colorTextInput', key: 'color.placeholder', attr: 'placeholder' },
            { selector: '#convertColorBtn', key: 'color.convert' },
            { selector: '#color-picker .output-header .form-label', key: 'color.outputLabel' },
            { selector: '#color-picker .result-item:nth-of-type(5) span:first-child', key: 'color.preview' },

            { selector: '#timestamp-converter .tool-header h2', key: 'timestamp.title' },
            { selector: '#timestamp-converter .tool-header p', key: 'timestamp.description' },
            { selector: '#timestamp-converter .input-section:nth-of-type(1) .form-label', key: 'timestamp.inputLabel' },
            { selector: '#timestampInput', key: 'timestamp.placeholder', attr: 'placeholder' },
            { selector: '#currentTimestampBtn', key: 'timestamp.useCurrent' },
            { selector: '#timestamp-converter .input-section:nth-of-type(2) .form-label', key: 'timestamp.dateLabel' },
            { selector: '#convertTimestampBtn', key: 'common.convert' },
            { selector: '#timestamp-converter .output-header .form-label', key: 'timestamp.outputLabel' },
            { selector: '#timestamp-converter .result-item:nth-of-type(1) span:first-child', key: 'timestamp.unixSeconds' },
            { selector: '#timestamp-converter .result-item:nth-of-type(2) span:first-child', key: 'timestamp.unixMilliseconds' },
            { selector: '#timestamp-converter .result-item:nth-of-type(5) span:first-child', key: 'timestamp.locale' },

            { selector: '#hash-generator .tool-header h2', key: 'hash.title' },
            { selector: '#hash-generator .tool-header p', key: 'hash.description' },
            { selector: '#hash-generator .input-section .form-label', key: 'hash.inputLabel' },
            { selector: '#hashInput', key: 'hash.placeholder', attr: 'placeholder' },
            { selector: '#generateHashBtn', key: 'hash.generate' },
            { selector: '#hash-generator .output-header .form-label', key: 'hash.outputLabel' },

            { selector: '#xml-beautifier .tool-header h2', key: 'xml.title' },
            { selector: '#xml-beautifier .tool-header p', key: 'xml.description' },
            { selector: '#xml-beautifier .input-section .form-label', key: 'xml.inputLabel' },
            { selector: '#xmlInput', key: 'xml.placeholder', attr: 'placeholder' },
            { selector: '#xml-beautifier .setting-item label:nth-of-type(1)', key: 'json.indent2', type: 'textNode', leadingSpace: true },
            { selector: '#xml-beautifier .setting-item label:nth-of-type(2)', key: 'json.indent4', type: 'textNode', leadingSpace: true },
            { selector: '#xml-beautifier .setting-item label:nth-of-type(3)', key: 'json.indentTab', type: 'textNode', leadingSpace: true },
            { selector: '#formatXmlBtn', key: 'xml.format' },
            { selector: '#xml-beautifier .output-section .form-label', key: 'xml.outputLabel' },

            { selector: '#cert-extractor .tool-header h2', key: 'cert.title' },
            { selector: '#cert-extractor .tool-header p', key: 'cert.description' },
            { selector: '#cert-extractor .input-section .form-label', key: 'cert.inputLabel' },
            { selector: '#certInput', key: 'cert.placeholder', attr: 'placeholder' },
            { selector: '#extractCertBtn', key: 'cert.extract' },
            { selector: '#cert-extractor .output-header .form-label', key: 'cert.outputLabel' },
            { selector: '#cert-extractor .result-item:nth-of-type(1) span:first-child', key: 'cert.subject' },
            { selector: '#cert-extractor .result-item:nth-of-type(2) span:first-child', key: 'cert.issuer' },
            { selector: '#cert-extractor .result-item:nth-of-type(3) span:first-child', key: 'cert.serial' },
            { selector: '#cert-extractor .result-item:nth-of-type(4) span:first-child', key: 'cert.validFrom' },
            { selector: '#cert-extractor .result-item:nth-of-type(5) span:first-child', key: 'cert.validTo' },
            { selector: '#cert-extractor .result-item:nth-of-type(6) span:first-child', key: 'cert.algorithm' },

            { selector: '#password-checker .tool-header h2', key: 'passwordCheck.title' },
            { selector: '#password-checker .tool-header p', key: 'passwordCheck.description' },
            { selector: '#password-checker .input-section .form-label', key: 'passwordCheck.inputLabel' },
            { selector: '#passwordInput', key: 'passwordCheck.placeholder', attr: 'placeholder' },
            { selector: '#password-checker .input-section > label', key: 'passwordCheck.showPassword', type: 'textNode', leadingSpace: true },
            { selector: '#checkPasswordBtn', key: 'passwordCheck.action' },
            { selector: '#password-checker .output-header .form-label', key: 'passwordCheck.outputLabel' },
            { selector: '#password-checker .result-item:nth-of-type(1) span:first-child', key: 'passwordCheck.length' },
            { selector: '#password-checker .result-item:nth-of-type(2) span:first-child', key: 'passwordCheck.uppercase' },
            { selector: '#password-checker .result-item:nth-of-type(3) span:first-child', key: 'passwordCheck.lowercase' },
            { selector: '#password-checker .result-item:nth-of-type(4) span:first-child', key: 'passwordCheck.numbers' },
            { selector: '#password-checker .result-item:nth-of-type(5) span:first-child', key: 'passwordCheck.symbols' },
            { selector: '#password-checker .result-item:nth-of-type(6) span:first-child', key: 'passwordCheck.score' },

            { selector: '#qr-generator .tool-header h2', key: 'qr.title' },
            { selector: '#qr-generator .tool-header p', key: 'qr.description' },
            { selector: '#qr-generator .input-section:nth-of-type(1) .form-label', key: 'qr.inputLabel' },
            { selector: '#qrTextInput', key: 'qr.placeholder', attr: 'placeholder' },
            { selector: '#qr-generator .options-section .setting-item label', key: 'qr.sizeLabel' },
            { selector: '#generateQrBtn', key: 'qr.generate' },
            { selector: '#qr-generator .output-section:nth-of-type(1) .form-label', key: 'qr.outputLabel' },
            { selector: '#downloadQrBtn', key: 'qr.download' },
            { selector: '#qrOutput span', key: 'qr.outputPlaceholder' },
            { selector: '#qr-generator .input-section:nth-of-type(2) .form-label', key: 'qr.uploadLabel' },
            { selector: '#qr-generator .output-section:nth-of-type(2) .form-label', key: 'qr.decodedLabel' },
            { selector: '#qrDecodedText', key: 'qr.decodedPlaceholder', attr: 'placeholder' },

            { selector: 'button[id^="copy"], .result-item .btn--sm', key: 'common.copy', all: true }
        ];
    }

    applySelectorTranslations() {
        this.getTranslationBindings().forEach(binding => {
            const elements = binding.all
                ? document.querySelectorAll(binding.selector)
                : [document.querySelector(binding.selector)].filter(Boolean);
            const message = this.t(binding.key);
            if (!message) return;

            elements.forEach(element => {
                if (binding.attr) {
                    element.setAttribute(binding.attr, message);
                    return;
                }

                if (binding.type === 'textNode') {
                    this.setElementTextNode(element, message, binding);
                    return;
                }

                element.textContent = message;
            });
        });
    }

    setElementTextNode(element, text, options = {}) {
        const { leadingSpace = false, trailingSpace = false } = options;
        const targetNode = Array.from(element.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '');
        const value = `${leadingSpace ? ' ' : ''}${text}${trailingSpace ? ' ' : ''}`;

        if (targetNode) {
            targetNode.nodeValue = value;
        } else {
            element.appendChild(document.createTextNode(value));
        }
    }

    // Theme Management
    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Detect system preference
        const getSystemTheme = () => {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };
        
        // Get saved theme or use system preference
        let currentTheme = localStorage.getItem('theme') || getSystemTheme();
        
        const setTheme = (theme, savePreference = true) => {
            currentTheme = theme;
            document.documentElement.setAttribute('data-color-scheme', theme);
            themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
            
            if (savePreference) {
                localStorage.setItem('theme', theme);
            }
        };

        // Set initial theme
        setTheme(currentTheme, false);
        
        // Listen for system theme changes
        const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof colorSchemeQuery.addEventListener === 'function') {
            colorSchemeQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    setTheme(e.matches ? 'dark' : 'light', false);
                }
            });
        }
        
        themeToggle.addEventListener('click', () => {
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Navigation Management
    initNavigation() {
        console.log('Initializing navigation');
        const toolLinks = document.querySelectorAll('.tool-link');
        console.log('Found tool links:', toolLinks.length);

        toolLinks.forEach((link, index) => {
            const toolId = link.getAttribute('data-tool');
            link.setAttribute('href', `#${toolId}`);
            console.log(`Tool link ${index}: ${toolId}`);
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`Clicked tool: ${toolId}`);
                this.switchTool(toolId);
            });
        });
    }

    initRouting() {
        window.addEventListener('hashchange', () => {
            const hashToolId = this.getToolIdFromHash();
            if (hashToolId) {
                this.switchTool(hashToolId, { updateHash: false });
            } else {
                this.showHome({ updateHash: false });
            }
        });
    }

    getToolIdFromHash() {
        const hash = window.location.hash.replace(/^#/, '').trim();
        if (!hash || hash === 'home') return null;

        return document.getElementById(hash) ? hash : null;
    }

    getInitialTool() {
        return this.getToolIdFromHash();
    }

    initHomeButton() {
        const homeToggle = document.getElementById('homeToggle');
        if (!homeToggle) return;

        homeToggle.addEventListener('click', () => {
            this.showHome();
        });
    }

    // Mobile Menu Management
    initMobileMenu() {
        const menuToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (!menuToggle || !sidebar || !overlay) return;
        
        const toggleMenu = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            menuToggle.textContent = sidebar.classList.contains('active') ? '✕' : '☰';
        };
        
        menuToggle.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
        
        // Close menu when clicking on a tool link
        const toolLinks = document.querySelectorAll('.tool-link');
        toolLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                    menuToggle.textContent = '☰';
                }
            });
        });
    }

    switchTool(toolId, options = {}) {
        const { updateHash = true } = options;

        if (!document.getElementById(toolId)) {
            console.error(`Tool container not found: ${toolId}`);
            return;
        }

        console.log(`Switching to tool: ${toolId}`);
        const homeView = document.getElementById('homeView');
        if (homeView) {
            homeView.classList.remove('active');
        }
        document.body.dataset.view = 'tool';
        
        // Hide all tool containers
        const allContainers = document.querySelectorAll('.tool-container');
        console.log(`Found ${allContainers.length} tool containers`);
        
        allContainers.forEach(container => {
            container.classList.remove('active');
        });

        // Show selected tool
        const selectedTool = document.getElementById(toolId);
        selectedTool.classList.add('active');
        console.log(`Activated tool: ${toolId}`);

        // Update navigation active state
        document.querySelectorAll('.tool-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-tool="${toolId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            console.log(`Set active link: ${toolId}`);
        }

        this.currentTool = toolId;
        this.currentView = 'tool';
        this.syncHomeToggleState();

        if (updateHash && window.location.hash !== `#${toolId}`) {
            window.location.hash = toolId;
        }
    }

    showHome(options = {}) {
        const { updateHash = true } = options;
        const homeView = document.getElementById('homeView');

        document.body.dataset.view = 'home';

        document.querySelectorAll('.tool-container').forEach(container => {
            container.classList.remove('active');
        });

        document.querySelectorAll('.tool-link').forEach(link => {
            link.classList.remove('active');
        });

        if (homeView) {
            homeView.classList.add('active');
        }

        this.currentTool = null;
        this.currentView = 'home';
        this.syncHomeToggleState();

        if (updateHash && window.location.hash !== '#home') {
            window.location.hash = 'home';
        }
    }

    syncHomeToggleState() {
        const homeToggle = document.getElementById('homeToggle');
        if (!homeToggle) return;

        const isHome = this.currentView === 'home';
        homeToggle.classList.toggle('active', isHome);
        homeToggle.setAttribute('aria-pressed', isHome ? 'true' : 'false');
    }

    renderHomeCatalog() {
        const catalog = document.getElementById('homeCatalog');
        if (!catalog) return;

        const categories = [...document.querySelectorAll('.tool-category')];
        catalog.innerHTML = '';

        categories.forEach((category, index) => {
            const categoryTitle = category.querySelector('h3')?.textContent?.trim();
            const links = [...category.querySelectorAll('.tool-link')];
            if (!categoryTitle || links.length === 0) return;

            const section = document.createElement('section');
            section.className = 'home-category';
            section.style.setProperty('--home-category-accent', `var(--color-bg-${(index % 8) + 1})`);

            const header = document.createElement('div');
            header.className = 'home-category-header';

            const title = document.createElement('h2');
            title.textContent = categoryTitle;

            const count = document.createElement('span');
            count.className = 'home-category-count';
            count.textContent = `${links.length}`;

            header.append(title, count);

            const grid = document.createElement('div');
            grid.className = 'home-card-grid';

            links.forEach(link => {
                const toolId = link.getAttribute('data-tool');
                const toolContainer = document.getElementById(toolId);
                if (!toolId || !toolContainer) return;

                const card = document.createElement('a');
                card.className = 'home-tool-card';
                card.href = `#${toolId}`;
                card.dataset.tool = toolId;

                const cardTitle = document.createElement('h3');
                cardTitle.textContent = link.textContent.trim();

                const cardDescription = document.createElement('p');
                cardDescription.textContent = toolContainer.querySelector('.tool-header p')?.textContent?.trim() || '';

                const cardCta = document.createElement('span');
                cardCta.className = 'home-tool-card-cta';
                cardCta.textContent = this.t('home.openTool', 'Open tool');

                card.append(cardTitle, cardDescription, cardCta);
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchTool(toolId);
                });

                grid.appendChild(card);
            });

            section.append(header, grid);
            catalog.appendChild(section);
        });
    }

    // Search Management
    initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.filterTools(e.target.value);
        });
    }

    filterTools(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        document.querySelectorAll('.tool-link').forEach(link => {
            const toolName = link.textContent.toLowerCase();
            const isVisible = !term || toolName.includes(term);
            
            if (isVisible) {
                link.classList.remove('search-hidden');
                link.style.display = '';
            } else {
                link.classList.add('search-hidden');
                link.style.display = 'none';
            }
        });

        // Handle categories
        document.querySelectorAll('.tool-category').forEach(category => {
            const visibleLinks = category.querySelectorAll('.tool-link:not(.search-hidden)');
            if (visibleLinks.length === 0 && term) {
                category.style.display = 'none';
            } else {
                category.style.display = '';
            }
        });
    }

    // Initialize all tools
    initTools() {
        console.log('Initializing tools');
        this.initListGenerator();
        this.initPasswordGenerator();
        this.initUsernameGenerator();
        this.initAddTextToLines();
        this.initConvertCase();
        this.initCountDuplicates();
        this.initDomainExtractor();
        this.initRemoveDuplicates();
        this.initRemoveLineBreaks();
        this.initRemoveLinesContaining();
        this.initEmailExtractor();
        this.initEmojiConverter();
        this.initBase64Converter();
        this.initUrlEncoder();
        this.initJsonFormatter();
        this.initDiffChecker();
        this.initRegexTester();
        this.initColorPicker();
        this.initTimestampConverter();
        this.initHashGenerator();
        this.initXmlBeautifier();
        this.initCertExtractor();
        this.initPasswordChecker();
        this.initQrGenerator();
    }

    // Utility function for copying to clipboard
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage(this.t('messages.copied', 'Copied to clipboard!'), 'success');
            }).catch(() => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showMessage(this.t('messages.copied', 'Copied to clipboard!'), 'success');
        } catch (err) {
            this.showMessage(this.t('messages.copyError', 'Copy failed'), 'error');
        }
        document.body.removeChild(textArea);
    }

    showMessage(message, type = 'success') {
        // Remove existing messages
        document.querySelectorAll('.success-message, .error-message').forEach(msg => msg.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = `${type}-message`;
        messageEl.textContent = message;
        
        // Add to the current active tool
        const activeTool = document.querySelector('.tool-container.active');
        if (activeTool) {
            activeTool.appendChild(messageEl);
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.remove();
                }
            }, 3000);
        }
    }

    setStatus(element, message, type = 'info') {
        if (!element) return;

        element.style.display = 'block';
        element.className = 'stats';
        if (type === 'success') element.classList.add('success-message');
        if (type === 'error') element.classList.add('error-message');
        element.textContent = message;
    }

    clearStatus(element) {
        if (!element) return;
        element.style.display = 'none';
        element.className = 'stats';
        element.textContent = '';
    }

    // 1. List Generator
    initListGenerator() {
        const container = document.getElementById('list-generator');
        if (!container) return;

        const input = container.querySelector('#listInput');
        const output = container.querySelector('#listOutput');
        const formatButtons = container.querySelectorAll('[data-format]');
        const copyBtn = container.querySelector('#copyListResult');

        if (!input || !output || !copyBtn) return;

        formatButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                const lines = input.value.split('\n').filter(line => line.trim());
                let result = '';

                switch (format) {
                    case 'numbered':
                        result = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
                        break;
                    case 'bulleted':
                        result = lines.map(line => `• ${line}`).join('\n');
                        break;
                    case 'comma':
                        result = lines.join(', ');
                        break;
                    case 'pipe':
                        result = lines.join(' | ');
                        break;
                }

                output.value = result;
            });
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // 2. Password Generator
    initPasswordGenerator() {
        const container = document.getElementById('password-generator');
        if (!container) return;

        const lengthSlider = container.querySelector('#passwordLength');
        const lengthValue = container.querySelector('#lengthValue');
        const countInput = container.querySelector('#passwordCount');
        const generateBtn = container.querySelector('#generatePassword');
        const resultsHeader = container.querySelector('#passwordResultsHeader');
        const resultsContainer = container.querySelector('#passwordResults');
        const copyAllBtn = container.querySelector('#copyAllPasswords');

        if (!lengthSlider || !generateBtn || !resultsContainer) return;

        lengthSlider.addEventListener('input', () => {
            if (lengthValue) lengthValue.textContent = lengthSlider.value;
        });

        generateBtn.addEventListener('click', () => {
            const length = parseInt(lengthSlider.value);
            const count = Math.max(1, Math.min(20, parseInt(countInput?.value || '5')));
            const includeUpper = container.querySelector('#includeUppercase')?.checked || false;
            const includeLower = container.querySelector('#includeLowercase')?.checked || true;
            const includeNumbers = container.querySelector('#includeNumbers')?.checked || false;
            const includeSymbols = container.querySelector('#includeSymbols')?.checked || false;

            const selectedCharsets = [];
            if (includeUpper) selectedCharsets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            if (includeLower) selectedCharsets.push('abcdefghijklmnopqrstuvwxyz');
            if (includeNumbers) selectedCharsets.push('0123456789');
            if (includeSymbols) selectedCharsets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

            if (selectedCharsets.length === 0) {
                this.showMessage(this.t('passwordGenerator.selectOneCharset', 'Select at least one character set!'), 'error');
                return;
            }

            const charset = selectedCharsets.join('');
            const getRandomIndex = (max) => {
                const values = new Uint32Array(1);
                crypto.getRandomValues(values);
                return values[0] % max;
            };

            const generatePasswordValue = () => {
                const passwordChars = selectedCharsets.map(set => set.charAt(getRandomIndex(set.length)));
                while (passwordChars.length < length) {
                    passwordChars.push(charset.charAt(getRandomIndex(charset.length)));
                }

                for (let i = passwordChars.length - 1; i > 0; i--) {
                    const j = getRandomIndex(i + 1);
                    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
                }

                return passwordChars.join('');
            };

            const passwords = Array.from({ length: count }, generatePasswordValue);
            resultsContainer.innerHTML = '';

            passwords.forEach(password => {
                const passwordItem = document.createElement('div');
                passwordItem.className = 'username-item';
                passwordItem.innerHTML = `
                    <span class="username-text">${password}</span>
                    <button class="btn btn--sm copy-password-item">${this.t('common.copy', 'Copy')}</button>
                `;

                passwordItem.querySelector('.copy-password-item').addEventListener('click', () => {
                    this.copyToClipboard(password);
                });

                resultsContainer.appendChild(passwordItem);
            });

            if (resultsHeader) {
                resultsHeader.style.display = passwords.length > 0 ? 'flex' : 'none';
            }

            copyAllBtn?.onclick = () => {
                this.copyToClipboard(passwords.join('\n'));
            };
        });
    }

    // 3. Username Generator
    initUsernameGenerator() {
        const container = document.getElementById('username-generator');
        if (!container) return;

        const generateBtn = container.querySelector('#generateUsernames');
        const resultsContainer = container.querySelector('#usernameResults');
        const resultsHeader = container.querySelector('#usernameResultsHeader');
        const copyAllBtn = container.querySelector('#copyAllUsernames');
        
        if (!generateBtn || !resultsContainer) return;

        const wordLists = {
            random: ['quick', 'lazy', 'happy', 'cool', 'smart', 'brave', 'calm', 'wild'],
            tech: ['cyber', 'digital', 'code', 'pixel', 'binary', 'matrix', 'data', 'cloud'],
            fantasy: ['dragon', 'wizard', 'magic', 'crystal', 'shadow', 'flame', 'storm', 'frost'],
            cool: ['ninja', 'phantom', 'thunder', 'lightning', 'steel', 'titan', 'cosmic', 'atomic']
        };

        generateBtn.addEventListener('click', () => {
            const style = container.querySelector('#usernameStyle')?.value || 'random';
            const count = parseInt(container.querySelector('#usernameCount')?.value || 5);
            const words = wordLists[style];
            const generatedUsernames = [];
            
            resultsContainer.innerHTML = '';
            
            for (let i = 0; i < count; i++) {
                const word1 = words[Math.floor(Math.random() * words.length)];
                const word2 = words[Math.floor(Math.random() * words.length)];
                const number = Math.floor(Math.random() * 1000);
                const username = `${word1}${word2}${number}`;
                generatedUsernames.push(username);
                
                const usernameItem = document.createElement('div');
                usernameItem.className = 'username-item';
                usernameItem.innerHTML = `
                    <span class="username-text">${username}</span>
                    <button class="btn btn--sm copy-username">${this.t('common.copy', 'Copy')}</button>
                `;
                
                usernameItem.querySelector('.copy-username').addEventListener('click', () => {
                    this.copyToClipboard(username);
                });
                
                resultsContainer.appendChild(usernameItem);
            }

            if (resultsHeader) {
                resultsHeader.style.display = generatedUsernames.length > 0 ? 'flex' : 'none';
            }

            copyAllBtn?.onclick = () => {
                this.copyToClipboard(generatedUsernames.join('\n'));
            };
        });
    }

    // 4. Add Text to Lines
    initAddTextToLines() {
        const container = document.getElementById('add-text-lines');
        if (!container) return;

        const originalText = container.querySelector('#originalText');
        const textToAdd = container.querySelector('#textToAdd');
        const output = container.querySelector('#addTextOutput');
        const copyBtn = container.querySelector('#copyAddTextResult');

        if (!originalText || !textToAdd || !output || !copyBtn) return;

        const updateOutput = () => {
            const lines = originalText.value.split('\n');
            const addition = textToAdd.value;
            const position = container.querySelector('input[name="position"]:checked')?.value || 'start';
            
            let result;
            if (position === 'start') {
                result = lines.map(line => addition + line).join('\n');
            } else {
                result = lines.map(line => line + addition).join('\n');
            }
            
            output.value = result;
        };

        originalText.addEventListener('input', updateOutput);
        textToAdd.addEventListener('input', updateOutput);
        container.querySelectorAll('input[name="position"]').forEach(radio => {
            radio.addEventListener('change', updateOutput);
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // 5. Convert Case
    initConvertCase() {
        const container = document.getElementById('convert-case');
        if (!container) return;

        const input = container.querySelector('#caseInput');
        const output = container.querySelector('#caseOutput');
        const caseButtons = container.querySelectorAll('[data-case]');
        const copyBtn = container.querySelector('#copyCaseResult');

        if (!input || !output || !copyBtn) return;

        caseButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const caseType = btn.getAttribute('data-case');
                let result = input.value;

                switch (caseType) {
                    case 'upper':
                        result = result.toUpperCase();
                        break;
                    case 'lower':
                        result = result.toLowerCase();
                        break;
                    case 'title':
                        result = result.replace(/\w\S*/g, txt => 
                            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                        break;
                    case 'camel':
                        result = result.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                            index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, '');
                        break;
                    case 'snake':
                        result = result.toLowerCase().replace(/\s+/g, '_');
                        break;
                    case 'constant':
                        result = result.toUpperCase().replace(/\s+/g, '_');
                        break;
                }

                output.value = result;
            });
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initCountDuplicates() {
        const container = document.getElementById('count-duplicates');
        if (!container) return;

        const input = container.querySelector('#duplicateInput');
        const analyzeBtn = container.querySelector('#analyzeDuplicates');
        const resultsContainer = container.querySelector('#duplicateResults');

        analyzeBtn?.addEventListener('click', () => {
            const lines = input.value.split('\n').map(line => line.trim()).filter(Boolean);
            const caseSensitive = container.querySelector('#caseSensitiveDuplicates')?.checked || false;
            const sortByCount = container.querySelector('#sortByCount')?.checked || false;

            if (lines.length === 0) {
                resultsContainer.textContent = this.t('duplicates.noEntries', 'Enter at least one item.');
                return;
            }

            const counts = new Map();
            const originals = new Map();
            lines.forEach(line => {
                const key = caseSensitive ? line : line.toLowerCase();
                counts.set(key, (counts.get(key) || 0) + 1);
                if (!originals.has(key)) originals.set(key, line);
            });

            const entries = [...counts.entries()].map(([key, count]) => ({
                value: originals.get(key),
                count,
                percentage: ((count / lines.length) * 100).toFixed(1)
            }));

            entries.sort(sortByCount
                ? (a, b) => b.count - a.count || a.value.localeCompare(b.value)
                : (a, b) => a.value.localeCompare(b.value));

            resultsContainer.innerHTML = '';
            entries.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'result-item';
                item.innerHTML = `<span class="result-text">${this.escapeHtml(entry.value)}</span><span>${entry.count} (${entry.percentage}%)</span>`;
                resultsContainer.appendChild(item);
            });
        });
    }

    initDomainExtractor() {
        const container = document.getElementById('domain-extractor');
        if (!container) return;

        const input = container.querySelector('#domainInput');
        const output = container.querySelector('#domainsOutput');
        const extractBtn = container.querySelector('#extractDomains');
        const copyBtn = container.querySelector('#copyDomainsResult');

        const normalizeDomain = (hostname, includeSubdomains) => {
            if (includeSubdomains) return hostname;
            const parts = hostname.split('.').filter(Boolean);
            return parts.length <= 2 ? hostname : parts.slice(-2).join('.');
        };

        extractBtn?.addEventListener('click', () => {
            const lines = input.value.split('\n').map(line => line.trim()).filter(Boolean);
            const includeSubdomains = container.querySelector('#includeSubdomains')?.checked || false;
            const domains = [];

            lines.forEach(line => {
                try {
                    const normalized = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(line) ? line : `https://${line}`;
                    const hostname = new URL(normalized).hostname;
                    if (hostname) domains.push(normalizeDomain(hostname, includeSubdomains));
                } catch (e) {
                    // Ignore malformed lines
                }
            });

            output.value = [...new Set(domains)].join('\n');
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initRemoveDuplicates() {
        const container = document.getElementById('remove-duplicates');
        if (!container) return;

        const input = container.querySelector('#removeDuplicatesInput');
        const output = container.querySelector('#removeDuplicatesOutput');
        const processBtn = container.querySelector('#removeDuplicatesBtn');
        const copyBtn = container.querySelector('#copyRemoveDuplicatesResult');

        processBtn?.addEventListener('click', () => {
            const lines = input.value.split('\n');
            const preserveOrder = container.querySelector('#preserveOrder')?.checked || false;
            const caseSensitive = container.querySelector('#caseSensitiveRemove')?.checked || false;
            const seen = new Set();
            const result = [];

            const pushLine = (line) => {
                const key = caseSensitive ? line : line.toLowerCase();
                if (seen.has(key)) return;
                seen.add(key);
                result.push(line);
            };

            if (preserveOrder) {
                lines.forEach(pushLine);
            } else {
                [...lines].sort((a, b) => a.localeCompare(b)).forEach(pushLine);
            }

            output.value = result.join('\n');
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initRemoveLineBreaks() {
        const container = document.getElementById('remove-line-breaks');
        if (!container) return;

        const input = container.querySelector('#lineBreaksInput');
        const output = container.querySelector('#lineBreaksOutput');
        const processBtn = container.querySelector('#removeLineBreaksBtn');
        const copyBtn = container.querySelector('#copyLineBreaksResult');

        processBtn?.addEventListener('click', () => {
            const replacementMode = container.querySelector('input[name="replacement"]:checked')?.value || 'space';
            const customReplacement = container.querySelector('#customReplacement')?.value || '';
            const replacement = replacementMode === 'space'
                ? ' '
                : replacementMode === 'custom'
                    ? customReplacement
                    : '';

            output.value = input.value.replace(/\r?\n+/g, replacement);
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initRemoveLinesContaining() {
        const container = document.getElementById('remove-lines-containing');
        if (!container) return;

        const input = container.querySelector('#removeContainingInput');
        const output = container.querySelector('#removeContainingOutput');
        const processBtn = container.querySelector('#removeContainingBtn');
        const stats = container.querySelector('#removeStats');
        const copyBtn = container.querySelector('#copyRemoveContainingResult');

        processBtn?.addEventListener('click', () => {
            const terms = container.querySelector('#wordsToRemove').value
                .split(',')
                .map(term => term.trim())
                .filter(Boolean);

            if (terms.length === 0) {
                output.value = input.value;
                this.setStatus(stats, this.t('removeContaining.noTerms', 'No words or phrases configured.'), 'info');
                return;
            }

            const caseSensitive = container.querySelector('#caseSensitiveContaining')?.checked || false;
            const haystackTerms = caseSensitive ? terms : terms.map(term => term.toLowerCase());
            const lines = input.value.split('\n');
            const kept = [];
            let removed = 0;

            lines.forEach(line => {
                const candidate = caseSensitive ? line : line.toLowerCase();
                const shouldRemove = haystackTerms.some(term => candidate.includes(term));
                if (shouldRemove) {
                    removed += 1;
                } else {
                    kept.push(line);
                }
            });

            output.value = kept.join('\n');
            this.setStatus(
                stats,
                `${this.t('removeContaining.removedLines', 'Removed lines')}: ${removed}\n${this.t('removeContaining.keptLines', 'Kept lines')}: ${kept.length}`,
                removed > 0 ? 'success' : 'info'
            );
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initEmailExtractor() {
        const container = document.getElementById('email-extractor');
        if (!container) return;

        const input = container.querySelector('#emailInput');
        const output = container.querySelector('#emailsOutput');
        const extractBtn = container.querySelector('#extractEmailsBtn');
        const stats = container.querySelector('#emailStats');
        const copyBtn = container.querySelector('#copyEmailsResult');

        extractBtn?.addEventListener('click', () => {
            const matches = input.value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
            const emails = container.querySelector('#removeDuplicateEmails')?.checked
                ? [...new Set(matches.map(email => email.toLowerCase()))]
                : matches;

            output.value = emails.join('\n');
            this.setStatus(stats, `${this.t('email.found', 'Emails found')}: ${emails.length}`, emails.length > 0 ? 'success' : 'info');
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initEmojiConverter() {
        const container = document.getElementById('emoji-converter');
        if (!container) return;

        const input = container.querySelector('#emojiInput');
        const output = container.querySelector('#emojiOutput');
        const toEmojiBtn = container.querySelector('#convertToEmojiBtn');
        const toShortcodeBtn = container.querySelector('#convertToShortcodeBtn');
        const copyBtn = container.querySelector('#copyEmojiResult');

        const emojiMap = {
            ':smile:': '😄',
            ':heart:': '❤️',
            ':thumbsup:': '👍',
            ':wave:': '👋',
            ':fire:': '🔥',
            ':rocket:': '🚀'
        };

        const shortcodeMap = Object.fromEntries(Object.entries(emojiMap).map(([shortcode, emoji]) => [emoji, shortcode]));

        toEmojiBtn?.addEventListener('click', () => {
            let result = input.value;
            Object.entries(emojiMap).forEach(([shortcode, emoji]) => {
                result = result.split(shortcode).join(emoji);
            });
            output.value = result;
        });

        toShortcodeBtn?.addEventListener('click', () => {
            let result = input.value;
            Object.entries(shortcodeMap).forEach(([emoji, shortcode]) => {
                result = result.split(emoji).join(shortcode);
            });
            output.value = result;
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // Base64 Encoder/Decoder
    initBase64Converter() {
        const container = document.getElementById('base64-converter');
        if (!container) return;

        const input = container.querySelector('#base64Input');
        const output = container.querySelector('#base64Output');
        const encodeBtn = container.querySelector('#base64EncodeBtn');
        const decodeBtn = container.querySelector('#base64DecodeBtn');
        const copyBtn = container.querySelector('#copyBase64Result');

        const toBase64 = (text) => {
            const bytes = new TextEncoder().encode(text);
            let binary = '';
            bytes.forEach(byte => {
                binary += String.fromCharCode(byte);
            });
            return btoa(binary);
        };

        const fromBase64 = (text) => {
            const binary = atob(text);
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            return new TextDecoder().decode(bytes);
        };

        encodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            try {
                output.value = toBase64(text);
            } catch (e) {
                output.value = this.t('base64.encodeError', 'Error: unable to encode the text');
            }
        });

        decodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            try {
                output.value = fromBase64(text);
            } catch (e) {
                output.value = this.t('base64.decodeError', 'Error: invalid Base64 input');
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // URL Encoder/Decoder
    initUrlEncoder() {
        const container = document.getElementById('url-encoder');
        if (!container) return;

        const input = container.querySelector('#urlInput');
        const output = container.querySelector('#urlOutput');
        const encodeBtn = container.querySelector('#urlEncodeBtn');
        const decodeBtn = container.querySelector('#urlDecodeBtn');
        const encodeComponentBtn = container.querySelector('#urlEncodeComponentBtn');
        const copyBtn = container.querySelector('#copyUrlResult');

        encodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            output.value = encodeURI(text);
        });

        decodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            try {
                output.value = decodeURI(text);
            } catch (e) {
                output.value = this.t('url.decodeError', 'Error: invalid URL');
            }
        });

        encodeComponentBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            output.value = encodeURIComponent(text);
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // JSON Formatter/Validator
    initJsonFormatter() {
        const container = document.getElementById('json-formatter');
        if (!container) return;

        const input = container.querySelector('#jsonInput');
        const output = container.querySelector('#jsonOutput');
        const formatBtn = container.querySelector('#formatJsonBtn');
        const copyBtn = container.querySelector('#copyJsonResult');
        const validation = container.querySelector('#jsonValidation');

        formatBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                this.clearStatus(validation);
                return;
            }

            try {
                const json = JSON.parse(text);
                const indentValue = container.querySelector('input[name="jsonIndent"]:checked')?.value || '2';
                
                let indent;
                if (indentValue === 'tab') {
                    indent = '\t';
                } else if (indentValue === 'compact') {
                    indent = '';
                } else {
                    indent = parseInt(indentValue);
                }

                output.value = indent === '' ? JSON.stringify(json) : JSON.stringify(json, null, indent);
                this.setStatus(validation, this.t('json.valid', 'Valid JSON'), 'success');
            } catch (e) {
                output.value = '';
                this.setStatus(validation, `${this.t('common.error', 'Error')}: ${e.message}`, 'error');
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // Diff Checker
    initDiffChecker() {
        const container = document.getElementById('diff-checker');
        if (!container) return;

        const text1 = container.querySelector('#diffText1');
        const text2 = container.querySelector('#diffText2');
        const compareBtn = container.querySelector('#compareDiffBtn');
        const output = container.querySelector('#diffOutput');
        const stats = container.querySelector('#diffStats');
        const ignoreCaseCheck = container.querySelector('#diffIgnoreCase');
        const ignoreWhitespaceCheck = container.querySelector('#diffIgnoreWhitespace');

        compareBtn?.addEventListener('click', () => {
            let content1 = text1.value;
            let content2 = text2.value;

            if (!content1 && !content2) {
                output.textContent = this.t('diff.enterBoth', 'Enter text in both fields');
                this.clearStatus(stats);
                return;
            }

            // Apply options
            if (ignoreCaseCheck?.checked) {
                content1 = content1.toLowerCase();
                content2 = content2.toLowerCase();
            }

            if (ignoreWhitespaceCheck?.checked) {
                content1 = content1.replace(/\s+/g, ' ').trim();
                content2 = content2.replace(/\s+/g, ' ').trim();
            }

            // Simple line-by-line diff
            const lines1 = content1.split('\n');
            const lines2 = content2.split('\n');
            const maxLines = Math.max(lines1.length, lines2.length);
            
            let diffHtml = '';
            let additions = 0;
            let deletions = 0;
            let unchanged = 0;

            for (let i = 0; i < maxLines; i++) {
                const line1 = lines1[i] || '';
                const line2 = lines2[i] || '';

                if (line1 === line2) {
                    diffHtml += `<div style="color: var(--color-text-secondary);">${this.escapeHtml(line1)}</div>`;
                    if (line1 || line2) unchanged++;
                } else if (!line1 && line2) {
                    diffHtml += `<div style="background: rgba(var(--color-success-rgb), 0.1); color: var(--color-success);">+ ${this.escapeHtml(line2)}</div>`;
                    additions++;
                } else if (line1 && !line2) {
                    diffHtml += `<div style="background: rgba(var(--color-error-rgb), 0.1); color: var(--color-error);">- ${this.escapeHtml(line1)}</div>`;
                    deletions++;
                } else {
                    diffHtml += `<div style="background: rgba(var(--color-error-rgb), 0.1); color: var(--color-error);">- ${this.escapeHtml(line1)}</div>`;
                    diffHtml += `<div style="background: rgba(var(--color-success-rgb), 0.1); color: var(--color-success);">+ ${this.escapeHtml(line2)}</div>`;
                    additions++;
                    deletions++;
                }
            }

            output.innerHTML = diffHtml || this.escapeHtml(this.t('diff.noDifferences', 'No differences found'));
            this.setStatus(
                stats,
                `${this.t('diff.additions', 'Additions')}: ${additions} | ${this.t('diff.deletions', 'Deletions')}: ${deletions} | ${this.t('diff.unchanged', 'Unchanged')}: ${unchanged}`,
                'info'
            );
        });
    }

    // Helper method to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Regex Tester
    initRegexTester() {
        const container = document.getElementById('regex-tester');
        if (!container) return;

        const patternInput = container.querySelector('#regexPattern');
        const textInput = container.querySelector('#regexInput');
        const globalCheck = container.querySelector('#regexGlobal');
        const ignoreCaseCheck = container.querySelector('#regexIgnoreCase');
        const multilineCheck = container.querySelector('#regexMultiline');
        const testBtn = container.querySelector('#testRegexBtn');
        const output = container.querySelector('#regexOutput');
        const stats = container.querySelector('#regexStats');

        testBtn?.addEventListener('click', () => {
            const pattern = patternInput.value.trim();
            const text = textInput.value;

            if (!pattern || !text) {
                output.textContent = this.t('regex.enterPatternAndText', 'Enter both the pattern and the text');
                this.clearStatus(stats);
                return;
            }

            try {
                // Build flags
                let flags = '';
                if (globalCheck?.checked) flags += 'g';
                if (ignoreCaseCheck?.checked) flags += 'i';
                if (multilineCheck?.checked) flags += 'm';

                // Parse pattern if it's in /pattern/flags format
                let regexPattern = pattern;
                if (pattern.startsWith('/')) {
                    const lastSlash = pattern.lastIndexOf('/');
                    if (lastSlash > 0) {
                        regexPattern = pattern.substring(1, lastSlash);
                        flags = pattern.substring(lastSlash + 1) || flags;
                    }
                }

                const regex = new RegExp(regexPattern, flags);
                const matchRegex = regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`);
                const matches = [...text.matchAll(matchRegex)];

                if (matches.length === 0) {
                    output.textContent = this.t('regex.noMatches', 'No matches found');
                    this.clearStatus(stats);
                } else {
                    let resultHtml = '';
                    matches.forEach((match, index) => {
                        resultHtml += `<div style="margin-bottom: var(--space-8);">`;
                        resultHtml += `<strong>Match ${index + 1}:</strong> "${this.escapeHtml(match[0])}"`;
                        if (match.index !== undefined) {
                            resultHtml += ` (posizione: ${match.index})`;
                        }
                        if (match.length > 1) {
                            resultHtml += `<br>Gruppi: `;
                            for (let i = 1; i < match.length; i++) {
                                resultHtml += `[${i}] "${this.escapeHtml(match[i] || '')}" `;
                            }
                        }
                        resultHtml += `</div>`;
                    });
                    output.innerHTML = resultHtml;
                    this.setStatus(stats, `${this.t('regex.foundMatches', 'Matches found')}: ${matches.length}`, 'success');
                }
            } catch (e) {
                output.textContent = `${this.t('regex.error', 'Regex error')}: ${e.message}`;
                this.clearStatus(stats);
            }
        });
    }

    // Color Picker/Converter
    initColorPicker() {
        const container = document.getElementById('color-picker');
        if (!container) return;

        const colorInput = container.querySelector('#colorInput');
        const textInput = container.querySelector('#colorTextInput');
        const convertBtn = container.querySelector('#convertColorBtn');
        const preview = container.querySelector('#colorPreview');
        
        // Sync color input with text input
        colorInput?.addEventListener('change', () => {
            textInput.value = colorInput.value;
        });

        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        const rgbToHsl = (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0;
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                }
            }
            return {
                h: Math.round(h * 360),
                s: Math.round(s * 100),
                l: Math.round(l * 100)
            };
        };

        convertBtn?.addEventListener('click', () => {
            let color = textInput.value.trim() || colorInput.value;
            if (!color) return;

            let rgb;
            
            // Parse color
            if (color.startsWith('#')) {
                rgb = hexToRgb(color);
            } else if (color.startsWith('rgb')) {
                const match = color.match(/(\d+),\s*(\d+),\s*(\d+)/);
                if (match) {
                    rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
                }
            }

            if (!rgb) {
                // Try as hex without #
                rgb = hexToRgb('#' + color);
            }

            if (rgb) {
                const hex = '#' + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
                const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

                container.querySelector('#colorHex').textContent = hex.toUpperCase();
                container.querySelector('#colorRgb').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                container.querySelector('#colorRgba').textContent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
                container.querySelector('#colorHsl').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                preview.style.backgroundColor = hex;
                colorInput.value = hex;
            }
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = container.querySelector(`#${elementId}`)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Timestamp Converter
    initTimestampConverter() {
        const container = document.getElementById('timestamp-converter');
        if (!container) return;

        const timestampInput = container.querySelector('#timestampInput');
        const dateInput = container.querySelector('#dateInput');
        const currentBtn = container.querySelector('#currentTimestampBtn');
        const convertBtn = container.querySelector('#convertTimestampBtn');

        currentBtn?.addEventListener('click', () => {
            const now = Date.now();
            timestampInput.value = Math.floor(now / 1000);
            convertBtn.click();
        });

        convertBtn?.addEventListener('click', () => {
            let date;
            
            if (timestampInput.value) {
                const timestamp = parseInt(timestampInput.value);
                // Detect if milliseconds or seconds
                date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);
            } else if (dateInput.value) {
                date = new Date(dateInput.value);
            } else {
                return;
            }

            if (isNaN(date.getTime())) {
                alert(this.t('timestamp.invalidDate', 'Invalid date'));
                return;
            }

            container.querySelector('#unixSeconds').textContent = Math.floor(date.getTime() / 1000);
            container.querySelector('#unixMilliseconds').textContent = date.getTime();
            container.querySelector('#iso8601').textContent = date.toISOString();
            container.querySelector('#utcString').textContent = date.toUTCString();
            container.querySelector('#localeString').textContent = date.toLocaleString();
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = container.querySelector(`#${elementId}`)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Hash Generator
    initHashGenerator() {
        const container = document.getElementById('hash-generator');
        if (!container) return;

        const input = container.querySelector('#hashInput');
        const generateBtn = container.querySelector('#generateHashBtn');

        // Simple hash functions (for demonstration - in production use crypto libraries)
        const simpleHash = async (text, algorithm) => {
            const msgBuffer = new TextEncoder().encode(text);
            const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        };

        generateBtn?.addEventListener('click', async () => {
            const text = input.value;
            if (!text) return;

            try {
                // Note: MD5 is not available in Web Crypto API, showing placeholder
                container.querySelector('#md5Hash').textContent = this.t('hash.md5Unsupported', 'MD5 not supported in the browser');
                container.querySelector('#sha1Hash').textContent = await simpleHash(text, 'SHA-1');
                container.querySelector('#sha256Hash').textContent = await simpleHash(text, 'SHA-256');
                container.querySelector('#sha512Hash').textContent = await simpleHash(text, 'SHA-512');
            } catch (e) {
                alert(`${this.t('hash.error', 'Hash generation error')}: ${e.message}`);
            }
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = container.querySelector(`#${elementId}`)?.textContent;
                if (text && text !== this.t('hash.md5Unsupported', 'MD5 not supported in the browser')) this.copyToClipboard(text);
            });
        });
    }

    // XML Beautifier
    initXmlBeautifier() {
        const container = document.getElementById('xml-beautifier');
        if (!container) return;

        const input = container.querySelector('#xmlInput');
        const output = container.querySelector('#xmlOutput');
        const formatBtn = container.querySelector('#formatXmlBtn');
        const copyBtn = container.querySelector('#copyXmlResult');
        const validation = container.querySelector('#xmlValidation');

        const formatXml = (xml, indent) => {
            const PADDING = indent === '\t' ? '\t' : ' '.repeat(parseInt(indent) || 2);
            const reg = /(>)(<)(\/*)/g;
            let formatted = '';
            let pad = 0;

            xml = xml.replace(reg, '$1\r\n$2$3');
            const lines = xml.split('\r\n');

            lines.forEach(line => {
                let indentChange = 0;
                if (line.match(/.+<\/\w[^>]*>$/)) {
                    indentChange = 0;
                } else if (line.match(/^<\/\w/)) {
                    if (pad !== 0) {
                        pad -= 1;
                    }
                } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
                    indentChange = 1;
                }

                formatted += PADDING.repeat(pad) + line + '\r\n';
                pad += indentChange;
            });

            return formatted.trim();
        };

        formatBtn?.addEventListener('click', () => {
            const xml = input.value.trim();
            if (!xml) {
                output.value = '';
                this.clearStatus(validation);
                return;
            }

            try {
                // Parse XML to validate
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, 'text/xml');
                const parseError = xmlDoc.querySelector('parsererror');

                if (parseError) {
                    output.value = '';
                    this.setStatus(validation, `${this.t('xml.invalid', 'Invalid XML')}: ${parseError.textContent}`, 'error');
                } else {
                    const indentValue = container.querySelector('input[name="xmlIndent"]:checked')?.value || '2';
                    const indent = indentValue === 'tab' ? '\t' : indentValue;
                    
                    output.value = formatXml(xml, indent);
                    this.setStatus(validation, this.t('xml.valid', 'Valid XML'), 'success');
                }
            } catch (e) {
                output.value = '';
                this.setStatus(validation, `${this.t('common.error', 'Error')}: ${e.message}`, 'error');
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // PEM Certificate Inspector
    initCertExtractor() {
        const container = document.getElementById('cert-extractor');
        if (!container) return;

        const input = container.querySelector('#certInput');
        const extractBtn = container.querySelector('#extractCertBtn');

        const pemToDer = (pemString) => {
            const base64 = pemString
                .replace(/-----BEGIN CERTIFICATE-----/, '')
                .replace(/-----END CERTIFICATE-----/, '')
                .replace(/\s/g, '');

            const binary = atob(base64);
            return Uint8Array.from(binary, char => char.charCodeAt(0));
        };

        const bytesToHex = (bytes) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(':').toUpperCase();

        extractBtn?.addEventListener('click', async () => {
            const cert = input.value.trim();
            if (!cert) return;

            if (!cert.includes('-----BEGIN CERTIFICATE-----')) {
                alert(this.t('cert.invalidFormat', 'Invalid certificate format. Please enter a PEM certificate.'));
                return;
            }

            try {
                const der = pemToDer(cert);
                const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', der));

                container.querySelector('#certSubject').textContent = this.t('cert.browserOnly', 'Not available in browser-only mode');
                container.querySelector('#certIssuer').textContent = this.t('cert.browserOnly', 'Not available in browser-only mode');
                container.querySelector('#certSerial').textContent = bytesToHex(digest);
                container.querySelector('#certValidFrom').textContent = `${this.t('cert.derSize', 'DER size')}: ${der.length} bytes`;
                container.querySelector('#certValidTo').textContent = this.t('cert.requiresAsn1', 'Requires a complete ASN.1 parser');
                container.querySelector('#certAlgorithm').textContent = this.t('cert.fingerprint', 'SHA-256 fingerprint');
            } catch (e) {
                alert(`${this.t('cert.parseError', 'Certificate parsing error')}: ${e.message}`);
            }
        });

        // Copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = container.querySelector(`#${elementId}`)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Password Strength Checker
    initPasswordChecker() {
        const container = document.getElementById('password-checker');
        if (!container) return;

        const input = container.querySelector('#passwordInput');
        const showPasswordCheck = container.querySelector('#showPassword');
        const checkBtn = container.querySelector('#checkPasswordBtn');

        showPasswordCheck?.addEventListener('change', () => {
            input.type = showPasswordCheck.checked ? 'text' : 'password';
        });

        const checkPasswordStrength = (password) => {
            let score = 0;
            const checks = {
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                lowercase: /[a-z]/.test(password),
                numbers: /\d/.test(password),
                symbols: /[^A-Za-z0-9]/.test(password)
            };

            // Calculate score
            if (password.length >= 8) score += 2;
            if (password.length >= 12) score += 1;
            if (checks.uppercase) score += 1;
            if (checks.lowercase) score += 1;
            if (checks.numbers) score += 1;
            if (checks.symbols) score += 2;

            // Additional checks
            if (password.length >= 16) score += 1;
            if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
            if (/^(.{1,3})\1+$/.test(password)) score -= 2; // Pattern repetition

            return { score: Math.max(0, score), checks };
        };

        checkBtn?.addEventListener('click', () => {
            const password = input.value;
            if (!password) return;

            const result = checkPasswordStrength(password);
            const { score, checks } = result;

            // Update UI
            container.querySelector('#passwordCheckLength').textContent = password.length;
            container.querySelector('#passwordUppercase').textContent = checks.uppercase ? '✓' : '✗';
            container.querySelector('#passwordLowercase').textContent = checks.lowercase ? '✓' : '✗';
            container.querySelector('#passwordNumbers').textContent = checks.numbers ? '✓' : '✗';
            container.querySelector('#passwordSymbols').textContent = checks.symbols ? '✓' : '✗';
            container.querySelector('#passwordScore').textContent = `${score}/8`;

            // Strength indicator
            const strengthElement = container.querySelector('#passwordStrength');
            let strengthText, strengthColor, strengthBg;

            if (score <= 3) {
                strengthText = this.t('passwordCheck.weak', 'Weak');
                strengthColor = 'var(--color-error)';
                strengthBg = 'rgba(var(--color-error-rgb), 0.1)';
            } else if (score <= 5) {
                strengthText = this.t('passwordCheck.medium', 'Medium');
                strengthColor = 'var(--color-warning)';
                strengthBg = 'rgba(var(--color-warning-rgb), 0.1)';
            } else {
                strengthText = this.t('passwordCheck.strong', 'Strong');
                strengthColor = 'var(--color-success)';
                strengthBg = 'rgba(var(--color-success-rgb), 0.1)';
            }

            strengthElement.innerHTML = `
                <div style="padding: var(--space-8); background: ${strengthBg}; color: ${strengthColor}; border-radius: var(--radius-base); text-align: center; font-weight: var(--font-weight-semibold);">
                    ${this.t('passwordCheck.passwordStrength', 'Password')}: ${strengthText} (${score}/8)
                </div>
            `;

            // Suggestions
            const suggestions = [];
            if (!checks.length) suggestions.push(`• ${this.t('passwordCheck.suggestionLength', 'Use at least 8 characters')}`);
            if (!checks.uppercase) suggestions.push(`• ${this.t('passwordCheck.suggestionUppercase', 'Add uppercase letters')}`);
            if (!checks.lowercase) suggestions.push(`• ${this.t('passwordCheck.suggestionLowercase', 'Add lowercase letters')}`);
            if (!checks.numbers) suggestions.push(`• ${this.t('passwordCheck.suggestionNumbers', 'Add numbers')}`);
            if (!checks.symbols) suggestions.push(`• ${this.t('passwordCheck.suggestionSymbols', 'Add special symbols')}`);
            if (password.length < 12) suggestions.push(`• ${this.t('passwordCheck.suggestionLonger', 'Consider using at least 12 characters')}`);

            container.querySelector('#passwordSuggestions').innerHTML = suggestions.length > 0 
                ? `<strong>${this.t('passwordCheck.suggestions', 'Suggestions')}:</strong><br>${suggestions.join('<br>')}`
                : `<strong>${this.t('passwordCheck.goodPassword', '✓ Strong password!')}</strong>`;
        });
    }

    // QR Code Generator/Reader
    initQrGenerator() {
        const container = document.getElementById('qr-generator');
        if (!container) return;

        const textInput = container.querySelector('#qrTextInput');
        const sizeSelect = container.querySelector('#qrSize');
        const generateBtn = container.querySelector('#generateQrBtn');
        const qrOutput = container.querySelector('#qrOutput');
        const downloadBtn = container.querySelector('#downloadQrBtn');
        const fileInput = container.querySelector('#qrFileInput');
        const decodedText = container.querySelector('#qrDecodedText');
        const copyBtn = container.querySelector('#copyQrText');

        generateBtn?.addEventListener('click', () => {
            const text = textInput.value.trim();
            const size = sizeSelect.value;
            
            if (!text) return;

            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
            
            qrOutput.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="max-width: 100%; height: auto; border-radius: var(--radius-base);">`;
            this.showMessage(this.t('qr.generatedExternal', 'QR generated through an external service.'), 'success');
            
            downloadBtn.style.display = 'inline-block';
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = qrUrl;
                link.download = 'qrcode.png';
                link.click();
            };
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!('BarcodeDetector' in window)) {
                decodedText.value = this.t('qr.barcodeUnsupported', 'This browser does not support BarcodeDetector for local QR reading.');
                return;
            }

            try {
                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                const imageBitmap = await createImageBitmap(file);
                const barcodes = await detector.detect(imageBitmap);
                decodedText.value = barcodes[0]?.rawValue || this.t('qr.noQrFound', 'No QR code detected in the image.');
            } catch (error) {
                decodedText.value = `${this.t('qr.readError', 'QR read error')}: ${error.message}`;
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(decodedText.value);
        });
    }
}

// Initialize the app when DOM is loaded
// document.addEventListener('DOMContentLoaded', () => {
//     console.log('DOM loaded, initializing app');
//     window.toolsApp = new OnlineToolsApp();
// });
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app');
    const app = new OnlineToolsApp();
    console.log('Sbrigasigapone, la saponetta');
    window.toolsApp = app;
});
