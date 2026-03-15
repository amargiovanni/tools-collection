// App initialization and management
class OnlineToolsApp {
    constructor() {
        this.currentTool = 'list-generator';
        this.supportedLanguages = ['en', 'it'];
        this.defaultLanguage = 'en';
        this.currentLanguage = this.defaultLanguage;
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
        
        // Set initial tool
        this.switchTool(this.getInitialTool(), { updateHash: false });
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
            const elements = document.querySelectorAll('[data-i18n]');
            console.log(`[i18n] Applying translations to ${elements.length} elements`);
            elements.forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (messages[key]) {
                    el.textContent = messages[key];
                } else {
                    console.warn(`[i18n] Missing translation for key: ${key}`);
                }
            });

            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                if (messages[key]) {
                    el.setAttribute('placeholder', messages[key]);
                }
            });

            document.documentElement.lang = this.currentLanguage;
            if (langToggle) {
                langToggle.textContent = this.currentLanguage.toUpperCase();
                langToggle.setAttribute('aria-label', `Switch language. Current language: ${this.currentLanguage.toUpperCase()}`);
                langToggle.title = `Language: ${this.currentLanguage.toUpperCase()}`;
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
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only update if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                setTheme(e.matches ? 'dark' : 'light', false);
            }
        });
        
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
            }
        });
    }

    getToolIdFromHash() {
        const hash = window.location.hash.replace(/^#/, '').trim();
        if (!hash) return null;

        return document.getElementById(hash) ? hash : null;
    }

    getInitialTool() {
        return this.getToolIdFromHash() || this.currentTool;
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

        if (updateHash && window.location.hash !== `#${toolId}`) {
            window.location.hash = toolId;
        }
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
        this.initCurlBurpConverter();
        this.initIocEscape();
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
        this.initJwtDecoder();
        this.initCertExtractor();
        this.initPasswordChecker();
        this.initQrGenerator();
    }

    // Utility function for copying to clipboard
    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Copiato negli appunti!', 'success');
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
            this.showMessage('Copiato negli appunti!', 'success');
        } catch (err) {
            this.showMessage('Errore durante la copia', 'error');
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
        const generateBtn = container.querySelector('#generatePassword');
        const passwordOutput = container.querySelector('#generatedPassword');
        const copyBtn = container.querySelector('#copyPassword');

        if (!lengthSlider || !generateBtn || !passwordOutput || !copyBtn) return;

        lengthSlider.addEventListener('input', () => {
            if (lengthValue) lengthValue.textContent = lengthSlider.value;
        });

        generateBtn.addEventListener('click', () => {
            const length = parseInt(lengthSlider.value);
            const includeUpper = container.querySelector('#includeUppercase')?.checked || false;
            const includeLower = container.querySelector('#includeLowercase')?.checked || true;
            const includeNumbers = container.querySelector('#includeNumbers')?.checked || false;
            const includeSymbols = container.querySelector('#includeSymbols')?.checked || false;

            let charset = '';
            if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
            if (includeNumbers) charset += '0123456789';
            if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (!charset) {
                this.showMessage('Seleziona almeno un tipo di carattere!', 'error');
                return;
            }

            let password = '';
            for (let i = 0; i < length; i++) {
                password += charset.charAt(Math.floor(Math.random() * charset.length));
            }

            passwordOutput.value = password;
        });

        copyBtn.addEventListener('click', () => {
            this.copyToClipboard(passwordOutput.value);
        });
    }

    // 3. Username Generator
    initUsernameGenerator() {
        const container = document.getElementById('username-generator');
        if (!container) return;

        const generateBtn = container.querySelector('#generateUsernames');
        const resultsContainer = container.querySelector('#usernameResults');
        
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
            
            resultsContainer.innerHTML = '';
            
            for (let i = 0; i < count; i++) {
                const word1 = words[Math.floor(Math.random() * words.length)];
                const word2 = words[Math.floor(Math.random() * words.length)];
                const number = Math.floor(Math.random() * 1000);
                const username = `${word1}${word2}${number}`;
                
                const usernameItem = document.createElement('div');
                usernameItem.className = 'username-item';
                usernameItem.innerHTML = `
                    <span class="username-text">${username}</span>
                    <button class="btn btn--sm copy-username">Copia</button>
                `;
                
                usernameItem.querySelector('.copy-username').addEventListener('click', () => {
                    this.copyToClipboard(username);
                });
                
                resultsContainer.appendChild(usernameItem);
            }
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

    // Additional tool implementations (simplified for space)
    initCountDuplicates() {
        const container = document.getElementById('count-duplicates');
        if (!container) return;
        // Implementation here
    }

    initDomainExtractor() {
        const container = document.getElementById('domain-extractor');
        if (!container) return;
        // Implementation here
    }

    initRemoveDuplicates() {
        const container = document.getElementById('remove-duplicates');
        if (!container) return;
        // Implementation here
    }

    initRemoveLineBreaks() {
        const container = document.getElementById('remove-line-breaks');
        if (!container) return;
        // Implementation here
    }

    initRemoveLinesContaining() {
        const container = document.getElementById('remove-lines-containing');
        if (!container) return;
        // Implementation here
    }

    initEmailExtractor() {
        const container = document.getElementById('email-extractor');
        if (!container) return;
        // Implementation here
    }

    initCurlBurpConverter() {
        const container = document.getElementById('curl-burp-converter');
        if (!container) return;
        // Implementation here
    }

    initIocEscape() {
        const container = document.getElementById('ioc-escape');
        if (!container) return;
        // Implementation here
    }

    initEmojiConverter() {
        const container = document.getElementById('emoji-converter');
        if (!container) return;
        // Implementation here
    }

    // Base64 Encoder/Decoder
    initBase64Converter() {
        const container = document.getElementById('base64-converter');
        if (!container) return;

        const input = document.getElementById('base64Input');
        const output = document.getElementById('base64Output');
        const encodeBtn = document.getElementById('base64EncodeBtn');
        const decodeBtn = document.getElementById('base64DecodeBtn');
        const copyBtn = document.getElementById('copyBase64Result');

        encodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            try {
                output.value = btoa(unescape(encodeURIComponent(text)));
            } catch (e) {
                output.value = 'Errore: impossibile codificare il testo';
            }
        });

        decodeBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                return;
            }
            try {
                output.value = decodeURIComponent(escape(atob(text)));
            } catch (e) {
                output.value = 'Errore: input non valido Base64';
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

        const input = document.getElementById('urlInput');
        const output = document.getElementById('urlOutput');
        const encodeBtn = document.getElementById('urlEncodeBtn');
        const decodeBtn = document.getElementById('urlDecodeBtn');
        const encodeComponentBtn = document.getElementById('urlEncodeComponentBtn');
        const copyBtn = document.getElementById('copyUrlResult');

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
                output.value = 'Errore: URL non valido';
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

        const input = document.getElementById('jsonInput');
        const output = document.getElementById('jsonOutput');
        const formatBtn = document.getElementById('formatJsonBtn');
        const copyBtn = document.getElementById('copyJsonResult');
        const validation = document.getElementById('jsonValidation');

        formatBtn?.addEventListener('click', () => {
            const text = input.value.trim();
            if (!text) {
                output.value = '';
                validation.style.display = 'none';
                return;
            }

            try {
                const json = JSON.parse(text);
                const indentValue = document.querySelector('input[name="jsonIndent"]:checked')?.value || '2';
                
                let indent;
                if (indentValue === 'tab') {
                    indent = '\t';
                } else if (indentValue === 'compact') {
                    indent = '';
                } else {
                    indent = parseInt(indentValue);
                }

                output.value = indent === '' ? JSON.stringify(json) : JSON.stringify(json, null, indent);
                
                validation.style.display = 'block';
                validation.innerHTML = '<span style="color: var(--color-success);">✓ JSON valido</span>';
                validation.className = 'stats success-message';
            } catch (e) {
                output.value = '';
                validation.style.display = 'block';
                validation.innerHTML = `<span style="color: var(--color-error);">✗ Errore: ${e.message}</span>`;
                validation.className = 'stats error-message';
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

        const text1 = document.getElementById('diffText1');
        const text2 = document.getElementById('diffText2');
        const compareBtn = document.getElementById('compareDiffBtn');
        const output = document.getElementById('diffOutput');
        const stats = document.getElementById('diffStats');
        const ignoreCaseCheck = document.getElementById('diffIgnoreCase');
        const ignoreWhitespaceCheck = document.getElementById('diffIgnoreWhitespace');

        compareBtn?.addEventListener('click', () => {
            let content1 = text1.value;
            let content2 = text2.value;

            if (!content1 && !content2) {
                output.innerHTML = 'Inserisci testo in entrambi i campi';
                stats.style.display = 'none';
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

            output.innerHTML = diffHtml || 'Nessuna differenza trovata';
            
            stats.style.display = 'block';
            stats.innerHTML = `Aggiunte: ${additions} | Rimosse: ${deletions} | Invariate: ${unchanged}`;
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

        const patternInput = document.getElementById('regexPattern');
        const textInput = document.getElementById('regexInput');
        const globalCheck = document.getElementById('regexGlobal');
        const ignoreCaseCheck = document.getElementById('regexIgnoreCase');
        const multilineCheck = document.getElementById('regexMultiline');
        const testBtn = document.getElementById('testRegexBtn');
        const output = document.getElementById('regexOutput');
        const stats = document.getElementById('regexStats');

        testBtn?.addEventListener('click', () => {
            const pattern = patternInput.value.trim();
            const text = textInput.value;

            if (!pattern || !text) {
                output.textContent = 'Inserisci sia il pattern che il testo';
                stats.style.display = 'none';
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
                const matches = [...text.matchAll(regex)];

                if (matches.length === 0) {
                    output.textContent = 'Nessuna corrispondenza trovata';
                    stats.style.display = 'none';
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
                    
                    stats.style.display = 'block';
                    stats.textContent = `Trovate ${matches.length} corrispondenze`;
                }
            } catch (e) {
                output.textContent = `Errore regex: ${e.message}`;
                stats.style.display = 'none';
            }
        });
    }

    // Color Picker/Converter
    initColorPicker() {
        const container = document.getElementById('color-picker');
        if (!container) return;

        const colorInput = document.getElementById('colorInput');
        const textInput = document.getElementById('colorTextInput');
        const convertBtn = document.getElementById('convertColorBtn');
        const preview = document.getElementById('colorPreview');
        
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

                document.getElementById('colorHex').textContent = hex.toUpperCase();
                document.getElementById('colorRgb').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                document.getElementById('colorRgba').textContent = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
                document.getElementById('colorHsl').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
                preview.style.backgroundColor = hex;
                colorInput.value = hex;
            }
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = document.getElementById(elementId)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Timestamp Converter
    initTimestampConverter() {
        const container = document.getElementById('timestamp-converter');
        if (!container) return;

        const timestampInput = document.getElementById('timestampInput');
        const dateInput = document.getElementById('dateInput');
        const currentBtn = document.getElementById('currentTimestampBtn');
        const convertBtn = document.getElementById('convertTimestampBtn');

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
                alert('Data non valida');
                return;
            }

            document.getElementById('unixSeconds').textContent = Math.floor(date.getTime() / 1000);
            document.getElementById('unixMilliseconds').textContent = date.getTime();
            document.getElementById('iso8601').textContent = date.toISOString();
            document.getElementById('utcString').textContent = date.toUTCString();
            document.getElementById('localeString').textContent = date.toLocaleString();
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = document.getElementById(elementId)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Hash Generator
    initHashGenerator() {
        const container = document.getElementById('hash-generator');
        if (!container) return;

        const input = document.getElementById('hashInput');
        const generateBtn = document.getElementById('generateHashBtn');

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
                document.getElementById('md5Hash').textContent = 'MD5 non supportato nel browser';
                document.getElementById('sha1Hash').textContent = await simpleHash(text, 'SHA-1');
                document.getElementById('sha256Hash').textContent = await simpleHash(text, 'SHA-256');
                document.getElementById('sha512Hash').textContent = await simpleHash(text, 'SHA-512');
            } catch (e) {
                alert('Errore nella generazione hash: ' + e.message);
            }
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = document.getElementById(elementId)?.textContent;
                if (text && text !== 'MD5 non supportato nel browser') this.copyToClipboard(text);
            });
        });
    }

    // XML Beautifier
    initXmlBeautifier() {
        const container = document.getElementById('xml-beautifier');
        if (!container) return;

        const input = document.getElementById('xmlInput');
        const output = document.getElementById('xmlOutput');
        const formatBtn = document.getElementById('formatXmlBtn');
        const copyBtn = document.getElementById('copyXmlResult');
        const validation = document.getElementById('xmlValidation');

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
                validation.style.display = 'none';
                return;
            }

            try {
                // Parse XML to validate
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(xml, 'text/xml');
                const parseError = xmlDoc.querySelector('parsererror');

                if (parseError) {
                    output.value = '';
                    validation.style.display = 'block';
                    validation.innerHTML = `<span style="color: var(--color-error);">✗ XML non valido: ${parseError.textContent}</span>`;
                    validation.className = 'stats error-message';
                } else {
                    const indentValue = document.querySelector('input[name="xmlIndent"]:checked')?.value || '2';
                    const indent = indentValue === 'tab' ? '\t' : indentValue;
                    
                    output.value = formatXml(xml, indent);
                    
                    validation.style.display = 'block';
                    validation.innerHTML = '<span style="color: var(--color-success);">✓ XML valido</span>';
                    validation.className = 'stats success-message';
                }
            } catch (e) {
                output.value = '';
                validation.style.display = 'block';
                validation.innerHTML = `<span style="color: var(--color-error);">✗ Errore: ${e.message}</span>`;
                validation.className = 'stats error-message';
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // JWT Decoder/Validator
    initJwtDecoder() {
        const container = document.getElementById('jwt-decoder');
        if (!container) return;

        const input = document.getElementById('jwtInput');
        const decodeBtn = document.getElementById('decodeJwtBtn');
        const validation = document.getElementById('jwtValidation');
        const headerOutput = document.getElementById('jwtHeader');
        const payloadOutput = document.getElementById('jwtPayload');
        const signatureOutput = document.getElementById('jwtSignature');

        const base64UrlDecode = (str) => {
            // Add padding if needed
            str += new Array(5 - str.length % 4).join('=');
            return atob(str.replace(/\-/g, '+').replace(/_/g, '/'));
        };

        decodeBtn?.addEventListener('click', () => {
            const jwt = input.value.trim();
            if (!jwt) return;

            try {
                const parts = jwt.split('.');
                if (parts.length !== 3) {
                    throw new Error('JWT deve avere 3 parti separate da punti');
                }

                // Decode header
                const header = JSON.parse(base64UrlDecode(parts[0]));
                headerOutput.value = JSON.stringify(header, null, 2);

                // Decode payload
                const payload = JSON.parse(base64UrlDecode(parts[1]));
                payloadOutput.value = JSON.stringify(payload, null, 2);

                // Show signature as hex (can't verify without secret)
                const signatureBytes = atob(parts[2].replace(/\-/g, '+').replace(/_/g, '/'));
                const signatureHex = Array.from(signatureBytes, byte => 
                    ('0' + (byte & 0xFF).toString(16)).slice(-2)
                ).join('');
                signatureOutput.value = signatureHex;

                // Basic validation
                validation.style.display = 'block';
                validation.className = 'stats success-message';
                
                let validationMsg = '✓ JWT decodificato con successo';
                
                // Check expiration
                if (payload.exp) {
                    const expDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    if (expDate < now) {
                        validationMsg += '<br>⚠️ Token scaduto il ' + expDate.toLocaleString();
                    } else {
                        validationMsg += '<br>✓ Token valido fino al ' + expDate.toLocaleString();
                    }
                }

                // Check issued at
                if (payload.iat) {
                    const iatDate = new Date(payload.iat * 1000);
                    validationMsg += '<br>📅 Emesso il ' + iatDate.toLocaleString();
                }

                validation.innerHTML = validationMsg;

            } catch (e) {
                validation.style.display = 'block';
                validation.className = 'stats error-message';
                validation.innerHTML = '✗ Errore: ' + e.message;
                
                headerOutput.value = '';
                payloadOutput.value = '';
                signatureOutput.value = '';
            }
        });

        // Copy buttons
        document.getElementById('copyJwtHeader')?.addEventListener('click', () => {
            this.copyToClipboard(headerOutput.value);
        });
        document.getElementById('copyJwtPayload')?.addEventListener('click', () => {
            this.copyToClipboard(payloadOutput.value);
        });
        document.getElementById('copyJwtSignature')?.addEventListener('click', () => {
            this.copyToClipboard(signatureOutput.value);
        });
    }

    // Certificate Info Extractor
    initCertExtractor() {
        const container = document.getElementById('cert-extractor');
        if (!container) return;

        const input = document.getElementById('certInput');
        const extractBtn = document.getElementById('extractCertBtn');

        const parseCertificate = (pemString) => {
            // Remove PEM headers/footers and whitespace
            const base64 = pemString
                .replace(/-----BEGIN CERTIFICATE-----/, '')
                .replace(/-----END CERTIFICATE-----/, '')
                .replace(/\s/g, '');
                
            // This is a simplified parser - in real applications you'd use a proper ASN.1 parser
            // For demonstration, we'll show placeholder data
            return {
                subject: 'Parsing certificati richiede librerie ASN.1 specializzate',
                issuer: 'Questa è una versione semplificata per demo',
                serialNumber: 'N/A - Parsing ASN.1 non implementato',
                validFrom: 'Non disponibile',
                validTo: 'Non disponibile',
                algorithm: 'Non disponibile'
            };
        };

        extractBtn?.addEventListener('click', () => {
            const cert = input.value.trim();
            if (!cert) return;

            if (cert.includes('-----BEGIN CERTIFICATE-----')) {
                try {
                    const certInfo = parseCertificate(cert);
                    
                    document.getElementById('certSubject').textContent = certInfo.subject;
                    document.getElementById('certIssuer').textContent = certInfo.issuer;
                    document.getElementById('certSerial').textContent = certInfo.serialNumber;
                    document.getElementById('certValidFrom').textContent = certInfo.validFrom;
                    document.getElementById('certValidTo').textContent = certInfo.validTo;
                    document.getElementById('certAlgorithm').textContent = certInfo.algorithm;
                    
                } catch (e) {
                    alert('Errore nel parsing del certificato: ' + e.message);
                }
            } else {
                alert('Formato certificato non valido. Inserisci un certificato PEM.');
            }
        });

        // Copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = document.getElementById(elementId)?.textContent;
                if (text) this.copyToClipboard(text);
            });
        });
    }

    // Password Strength Checker
    initPasswordChecker() {
        const container = document.getElementById('password-checker');
        if (!container) return;

        const input = document.getElementById('passwordInput');
        const showPasswordCheck = document.getElementById('showPassword');
        const checkBtn = document.getElementById('checkPasswordBtn');

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
            document.getElementById('passwordLength').textContent = password.length;
            document.getElementById('passwordUppercase').textContent = checks.uppercase ? '✓' : '✗';
            document.getElementById('passwordLowercase').textContent = checks.lowercase ? '✓' : '✗';
            document.getElementById('passwordNumbers').textContent = checks.numbers ? '✓' : '✗';
            document.getElementById('passwordSymbols').textContent = checks.symbols ? '✓' : '✗';
            document.getElementById('passwordScore').textContent = `${score}/8`;

            // Strength indicator
            const strengthElement = document.getElementById('passwordStrength');
            let strengthText, strengthColor, strengthBg;

            if (score <= 3) {
                strengthText = 'Debole';
                strengthColor = 'var(--color-error)';
                strengthBg = 'rgba(var(--color-error-rgb), 0.1)';
            } else if (score <= 5) {
                strengthText = 'Media';
                strengthColor = 'var(--color-warning)';
                strengthBg = 'rgba(var(--color-warning-rgb), 0.1)';
            } else {
                strengthText = 'Forte';
                strengthColor = 'var(--color-success)';
                strengthBg = 'rgba(var(--color-success-rgb), 0.1)';
            }

            strengthElement.innerHTML = `
                <div style="padding: var(--space-8); background: ${strengthBg}; color: ${strengthColor}; border-radius: var(--radius-base); text-align: center; font-weight: var(--font-weight-semibold);">
                    Password: ${strengthText} (${score}/8)
                </div>
            `;

            // Suggestions
            const suggestions = [];
            if (!checks.length) suggestions.push('• Usa almeno 8 caratteri');
            if (!checks.uppercase) suggestions.push('• Aggiungi lettere maiuscole');
            if (!checks.lowercase) suggestions.push('• Aggiungi lettere minuscole');
            if (!checks.numbers) suggestions.push('• Aggiungi numeri');
            if (!checks.symbols) suggestions.push('• Aggiungi simboli speciali');
            if (password.length < 12) suggestions.push('• Considera di usare almeno 12 caratteri');

            document.getElementById('passwordSuggestions').innerHTML = suggestions.length > 0 
                ? `<strong>Suggerimenti:</strong><br>${suggestions.join('<br>')}`
                : '<strong>✓ Password robusta!</strong>';
        });
    }

    // QR Code Generator/Reader
    initQrGenerator() {
        const container = document.getElementById('qr-generator');
        if (!container) return;

        const textInput = document.getElementById('qrTextInput');
        const sizeSelect = document.getElementById('qrSize');
        const generateBtn = document.getElementById('generateQrBtn');
        const qrOutput = document.getElementById('qrOutput');
        const downloadBtn = document.getElementById('downloadQrBtn');
        const fileInput = document.getElementById('qrFileInput');
        const decodedText = document.getElementById('qrDecodedText');
        const copyBtn = document.getElementById('copyQrText');

        // Simple QR code generation using QR Server API
        generateBtn?.addEventListener('click', () => {
            const text = textInput.value.trim();
            const size = sizeSelect.value;
            
            if (!text) return;

            // Use QR Server API for generation (free service)
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
            
            qrOutput.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="max-width: 100%; height: auto; border-radius: var(--radius-base);">`;
            
            downloadBtn.style.display = 'inline-block';
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = qrUrl;
                link.download = 'qrcode.png';
                link.click();
            };
        });

        // File reading for QR code decoding
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Note: QR code reading from image requires a specialized library like jsQR
            // For this demo, we'll show a placeholder message
            decodedText.value = 'La lettura di QR code da immagine richiede librerie specializzate come jsQR. Questa funzionalità non è implementata in questa versione demo.';
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
