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

            const selectedCharsets = [];
            if (includeUpper) selectedCharsets.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
            if (includeLower) selectedCharsets.push('abcdefghijklmnopqrstuvwxyz');
            if (includeNumbers) selectedCharsets.push('0123456789');
            if (includeSymbols) selectedCharsets.push('!@#$%^&*()_+-=[]{}|;:,.<>?');

            if (selectedCharsets.length === 0) {
                this.showMessage('Seleziona almeno un tipo di carattere!', 'error');
                return;
            }

            const charset = selectedCharsets.join('');
            const getRandomIndex = (max) => {
                const values = new Uint32Array(1);
                crypto.getRandomValues(values);
                return values[0] % max;
            };

            const passwordChars = selectedCharsets.map(set => set.charAt(getRandomIndex(set.length)));
            while (passwordChars.length < length) {
                passwordChars.push(charset.charAt(getRandomIndex(charset.length)));
            }

            for (let i = passwordChars.length - 1; i > 0; i--) {
                const j = getRandomIndex(i + 1);
                [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
            }

            passwordOutput.value = passwordChars.join('');
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
                resultsContainer.textContent = 'Inserisci almeno una voce.';
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
                this.setStatus(stats, 'Nessuna parola/frase configurata.', 'info');
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
            this.setStatus(stats, `Righe rimosse: ${removed}\nRighe mantenute: ${kept.length}`, removed > 0 ? 'success' : 'info');
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
            this.setStatus(stats, `Email trovate: ${emails.length}`, emails.length > 0 ? 'success' : 'info');
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initCurlBurpConverter() {
        const container = document.getElementById('curl-burp-converter');
        if (!container) return;

        const input = container.querySelector('#curlInput');
        const output = container.querySelector('#curlOutput');
        const convertBtn = container.querySelector('#convertCurlBtn');
        const copyBtn = container.querySelector('#copyCurlResult');

        const unquote = (value) => value.replace(/^['"]|['"]$/g, '');

        convertBtn?.addEventListener('click', () => {
            const curl = input.value.trim();
            if (!curl) {
                output.value = '';
                return;
            }

            const urlMatch = curl.match(/https?:\/\/[^\s'"\\]+|['"]https?:\/\/[^'"]+['"]/i);
            if (!urlMatch) {
                output.value = 'Errore: impossibile trovare un URL valido nel comando curl.';
                return;
            }

            try {
                const url = new URL(unquote(urlMatch[0]));
                const method = (curl.match(/(?:^|\s)-X\s+([A-Z]+)/i)?.[1] || (curl.includes(' --data') || curl.includes(' -d ') ? 'POST' : 'GET')).toUpperCase();
                const headers = [...curl.matchAll(/(?:^|\s)-H\s+(['"])(.*?)\1/g)].map(match => match[2]);
                const bodyMatch = curl.match(/(?:^|\s)(?:--data(?:-raw)?|-d)\s+(['"])([\s\S]*?)\1/i);
                const body = bodyMatch ? bodyMatch[2] : '';

                const requestLines = [
                    `${method} ${url.pathname || '/'}${url.search} HTTP/1.1`,
                    `Host: ${url.host}`,
                    ...headers
                ];

                if (body && !headers.some(header => header.toLowerCase().startsWith('content-length:'))) {
                    requestLines.push(`Content-Length: ${new TextEncoder().encode(body).length}`);
                }

                output.value = `${requestLines.join('\r\n')}\r\n\r\n${body}`;
            } catch (e) {
                output.value = `Errore: ${e.message}`;
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    initIocEscape() {
        const container = document.getElementById('ioc-escape');
        if (!container) return;

        const input = container.querySelector('#iocInput');
        const output = container.querySelector('#iocOutput');
        const escapeBtn = container.querySelector('#escapeIocBtn');
        const unescapeBtn = container.querySelector('#unescapeIocBtn');
        const copyBtn = container.querySelector('#copyIocResult');

        const escapeIocs = (text) => text
            .replace(/https/gi, 'hxxps')
            .replace(/http/gi, 'hxxp')
            .replace(/\./g, '[.]')
            .replace(/@/g, '[@]');

        const unescapeIocs = (text) => text
            .replace(/\[\.\]/g, '.')
            .replace(/\[@\]/g, '@')
            .replace(/hxxps/gi, 'https')
            .replace(/hxxp/gi, 'http');

        escapeBtn?.addEventListener('click', () => {
            output.value = escapeIocs(input.value);
        });

        unescapeBtn?.addEventListener('click', () => {
            output.value = unescapeIocs(input.value);
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
                output.value = fromBase64(text);
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
                this.setStatus(validation, 'JSON valido', 'success');
            } catch (e) {
                output.value = '';
                this.setStatus(validation, `Errore: ${e.message}`, 'error');
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
                output.textContent = 'Inserisci testo in entrambi i campi';
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

            output.innerHTML = diffHtml || this.escapeHtml('Nessuna differenza trovata');
            this.setStatus(stats, `Aggiunte: ${additions} | Rimosse: ${deletions} | Invariate: ${unchanged}`, 'info');
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
                output.textContent = 'Inserisci sia il pattern che il testo';
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
                    output.textContent = 'Nessuna corrispondenza trovata';
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
                    this.setStatus(stats, `Trovate ${matches.length} corrispondenze`, 'success');
                }
            } catch (e) {
                output.textContent = `Errore regex: ${e.message}`;
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
                alert('Data non valida');
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
                container.querySelector('#md5Hash').textContent = 'MD5 non supportato nel browser';
                container.querySelector('#sha1Hash').textContent = await simpleHash(text, 'SHA-1');
                container.querySelector('#sha256Hash').textContent = await simpleHash(text, 'SHA-256');
                container.querySelector('#sha512Hash').textContent = await simpleHash(text, 'SHA-512');
            } catch (e) {
                alert('Errore nella generazione hash: ' + e.message);
            }
        });

        // Add copy functionality
        container.querySelectorAll('button[data-copy]').forEach(btn => {
            btn.addEventListener('click', () => {
                const elementId = btn.getAttribute('data-copy');
                const text = container.querySelector(`#${elementId}`)?.textContent;
                if (text && text !== 'MD5 non supportato nel browser') this.copyToClipboard(text);
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
                    this.setStatus(validation, `XML non valido: ${parseError.textContent}`, 'error');
                } else {
                    const indentValue = container.querySelector('input[name="xmlIndent"]:checked')?.value || '2';
                    const indent = indentValue === 'tab' ? '\t' : indentValue;
                    
                    output.value = formatXml(xml, indent);
                    this.setStatus(validation, 'XML valido', 'success');
                }
            } catch (e) {
                output.value = '';
                this.setStatus(validation, `Errore: ${e.message}`, 'error');
            }
        });

        copyBtn?.addEventListener('click', () => {
            this.copyToClipboard(output.value);
        });
    }

    // JWT Decoder/Inspector
    initJwtDecoder() {
        const container = document.getElementById('jwt-decoder');
        if (!container) return;

        const input = container.querySelector('#jwtInput');
        const decodeBtn = container.querySelector('#decodeJwtBtn');
        const validation = container.querySelector('#jwtValidation');
        const headerOutput = container.querySelector('#jwtHeader');
        const payloadOutput = container.querySelector('#jwtPayload');
        const signatureOutput = container.querySelector('#jwtSignature');

        const base64UrlDecode = (str) => {
            const padding = (4 - (str.length % 4)) % 4;
            const normalized = `${str}${'='.repeat(padding)}`.replace(/\-/g, '+').replace(/_/g, '/');
            return atob(normalized);
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
                const signatureBytes = base64UrlDecode(parts[2]);
                const signatureHex = Array.from(signatureBytes, byte => 
                    ('0' + (byte & 0xFF).toString(16)).slice(-2)
                ).join('');
                signatureOutput.value = signatureHex;

                const validationLines = ['JWT decodificato con successo', 'Firma non verificata in questa versione'];
                
                if (payload.exp) {
                    const expDate = new Date(payload.exp * 1000);
                    const now = new Date();
                    if (expDate < now) {
                        validationLines.push(`Token scaduto il ${expDate.toLocaleString()}`);
                    } else {
                        validationLines.push(`Token valido fino al ${expDate.toLocaleString()}`);
                    }
                }

                if (payload.iat) {
                    const iatDate = new Date(payload.iat * 1000);
                    validationLines.push(`Emesso il ${iatDate.toLocaleString()}`);
                }

                this.setStatus(validation, validationLines.join('\n'), 'success');
            } catch (e) {
                this.setStatus(validation, `Errore: ${e.message}`, 'error');
                
                headerOutput.value = '';
                payloadOutput.value = '';
                signatureOutput.value = '';
            }
        });

        // Copy buttons
        container.querySelector('#copyJwtHeader')?.addEventListener('click', () => {
            this.copyToClipboard(headerOutput.value);
        });
        container.querySelector('#copyJwtPayload')?.addEventListener('click', () => {
            this.copyToClipboard(payloadOutput.value);
        });
        container.querySelector('#copyJwtSignature')?.addEventListener('click', () => {
            this.copyToClipboard(signatureOutput.value);
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
                alert('Formato certificato non valido. Inserisci un certificato PEM.');
                return;
            }

            try {
                const der = pemToDer(cert);
                const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', der));

                container.querySelector('#certSubject').textContent = 'Non disponibile in modalità browser-only';
                container.querySelector('#certIssuer').textContent = 'Non disponibile in modalità browser-only';
                container.querySelector('#certSerial').textContent = bytesToHex(digest);
                container.querySelector('#certValidFrom').textContent = `DER size: ${der.length} bytes`;
                container.querySelector('#certValidTo').textContent = 'Richiede parser ASN.1 completo';
                container.querySelector('#certAlgorithm').textContent = 'Fingerprint SHA-256';
            } catch (e) {
                alert('Errore nel parsing del certificato: ' + e.message);
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

            container.querySelector('#passwordSuggestions').innerHTML = suggestions.length > 0 
                ? `<strong>Suggerimenti:</strong><br>${suggestions.join('<br>')}`
                : '<strong>✓ Password robusta!</strong>';
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
            this.showMessage('QR generato tramite un servizio esterno.', 'success');
            
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
                decodedText.value = 'Questo browser non supporta BarcodeDetector per la lettura locale dei QR.';
                return;
            }

            try {
                const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
                const imageBitmap = await createImageBitmap(file);
                const barcodes = await detector.detect(imageBitmap);
                decodedText.value = barcodes[0]?.rawValue || 'Nessun QR code rilevato nell’immagine.';
            } catch (error) {
                decodedText.value = `Errore nella lettura del QR: ${error.message}`;
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
