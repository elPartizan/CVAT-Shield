// CVAT Shield - защита от случайных удалений

// Проверка, что мы на нужном хосте
const allowedHosts = ['192.168.0.103:8080', 'localhost:8080'];
const currentHost = window.location.host;

if (!allowedHosts.includes(currentHost)) {
    console.log('[CVAT] Расширение активно только для CVAT, пропускаем:', currentHost);
} else {
    console.log('[CVAT] Запуск на разрешённом хосте:', currentHost);

// ========== ЧАСТЬ 1: ОТКЛЮЧЕНИЕ КНОПОК DELETE ==========

function blockClicksOnElement(element) {
    if (!element) return;
    if (element._blockerAttached) return;
    element._blockerAttached = true;
    
    element.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        alert('⚠️ ДОСТУП ЗАПРЕЩЁН ⚠️\n\nУ вас нет прав на удаление!');
        return false;
    }, true);
    
    element.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, true);
    
    element.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            alert('⚠️ ДОСТУП ЗАПРЕЩЁН ⚠️\n\nУ вас нет прав на удаление!');
            return false;
        }
    }, true);
}

function disableDeleteButtons() {
    // 1. По data-menu-id
    const deleteItems = document.querySelectorAll('[data-menu-id*="delete"]');
    deleteItems.forEach(item => {
        item.style.pointerEvents = 'none';
        item.style.opacity = '0.5';
        item.style.cursor = 'not-allowed';
        item.setAttribute('disabled', 'true');
        item.setAttribute('aria-disabled', 'true');
        blockClicksOnElement(item);
    });
    
    // 2. Пункты меню с текстом "Delete"
    const menuItems = document.querySelectorAll('.ant-dropdown-menu-item');
    menuItems.forEach(item => {
        const title = item.querySelector('.ant-dropdown-menu-title-content');
        if (title && title.textContent.trim() === 'Delete') {
            item.style.pointerEvents = 'none';
            item.style.opacity = '0.5';
            item.style.cursor = 'not-allowed';
            item.setAttribute('disabled', 'true');
            blockClicksOnElement(item);
        }
    });
    
    // 3. Иконки корзины в конструкторе лейблов
    const deleteIcons = document.querySelectorAll('.anticon-delete');
    deleteIcons.forEach(icon => {
        const parent = icon.closest('[role="button"], button, .ant-dropdown-menu-item, .cvat-constructor-viewer-item span');
        if (parent) {
            parent.style.pointerEvents = 'none';
            parent.style.opacity = '0.5';
            parent.style.cursor = 'not-allowed';
            blockClicksOnElement(parent);
        }
    });
}

function globalClickBlocker(e) {
    let target = e.target;
    while (target && target !== document.body) {
        if (target.getAttribute && target.getAttribute('data-menu-id') && 
            target.getAttribute('data-menu-id').includes('delete')) {
            e.preventDefault();
            e.stopPropagation();
            alert('⚠️ ДОСТУП ЗАПРЕЩЁН ⚠️\n\nУ вас нет прав на удаление!');
            return false;
        }
        if (target.textContent && target.textContent.trim() === 'Delete' &&
            target.classList && target.classList.contains('ant-dropdown-menu-item')) {
            e.preventDefault();
            e.stopPropagation();
            alert('⚠️ ДОСТУП ЗАПРЕЩЁН ⚠️\n\nУ вас нет прав на удаление!');
            return false;
        }
        if (target.classList && target.classList.contains('anticon-delete')) {
            e.preventDefault();
            e.stopPropagation();
            alert('⚠️ ДОСТУП ЗАПРЕЩЁН ⚠️\n\nУ вас нет прав на удаление!');
            return false;
        }
        target = target.parentElement;
    }
}

// ========== ЧАСТЬ 2: СКРЫТИЕ RAW/CONSTRUCTOR С КНОПКОЙ (ТОЛЬКО НА /PROJECTS) ==========

let isRawVisible = false;
let rawTabsContainer = null;
let rawTabsContent = null;

function setupRawProtector() {
    if (!window.location.pathname.includes('/projects')) {
        return;
    }
    
    rawTabsContainer = document.querySelector('.ant-tabs-nav');
    rawTabsContent = document.querySelector('.ant-tabs-content-holder');
    
    if (!rawTabsContainer && !rawTabsContent) return;
    if (document.getElementById('cvat-show-raw-btn')) return;
    
    if (rawTabsContainer) rawTabsContainer.style.display = 'none';
    if (rawTabsContent) rawTabsContent.style.display = 'none';
    
    const targetParent = rawTabsContainer ? rawTabsContainer.closest('.ant-tabs') : 
                        (rawTabsContent ? rawTabsContent.closest('.ant-tabs') : null);
    
    if (!targetParent) return;
    
    const button = document.createElement('button');
    button.id = 'cvat-show-raw-btn';
    button.textContent = '🔓 Показать Raw/Constructor';
    button.style.cssText = `
        background: #1890ff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 16px;
        transition: all 0.2s;
        z-index: 1000;
    `;
    
    button.onmouseenter = () => button.style.background = '#40a9ff';
    button.onmouseleave = () => button.style.background = isRawVisible ? '#ff4d4f' : '#1890ff';
    
    button.onclick = () => {
        if (isRawVisible) {
            if (rawTabsContainer) rawTabsContainer.style.display = 'none';
            if (rawTabsContent) rawTabsContent.style.display = 'none';
            button.textContent = '🔓 Показать Raw/Constructor';
            button.style.background = '#1890ff';
            isRawVisible = false;
        } else {
            if (rawTabsContainer) rawTabsContainer.style.display = '';
            if (rawTabsContent) rawTabsContent.style.display = '';
            button.textContent = '🔒 Скрыть Raw/Constructor';
            button.style.background = '#ff4d4f';
            isRawVisible = true;
        }
    };
    
    if (rawTabsContainer) {
        targetParent.insertBefore(button, rawTabsContainer);
    } else if (rawTabsContent) {
        targetParent.insertBefore(button, rawTabsContent);
    }
}

// ========== ЧАСТЬ 3: УСТАНОВКА IMAGE QUALITY = 100 ==========

function setImageQualityTo100() {
    let qualityInput = document.getElementById('imageQuality');
    
    if (!qualityInput) {
        qualityInput = document.querySelector('input[type="number"][id*="imageQuality"]');
    }
    
    if (qualityInput) {
        const currentValue = parseInt(qualityInput.value, 10);
        if (currentValue !== 100) {
            qualityInput.value = '100';
            qualityInput.dispatchEvent(new Event('input', { bubbles: true }));
            qualityInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

// ========== ЧАСТЬ 4: СКРЫТИЕ НАСТРОЕК ДЛЯ ВСЕХ ==========

function hideAllSettings() {
    // Скрываем кнопку Settings для всех пользователей без исключений
    const settingsButtons = document.querySelectorAll('[data-menu-id*="open_organization"], .cvat-header-menu-open-organization');
    settingsButtons.forEach(button => {
        button.style.display = 'none';
    });
}

// ========== ЗАПУСК ==========

function runAll() {
    disableDeleteButtons();
    setupRawProtector();
    setImageQualityTo100();
    hideAllSettings();
}

const observer = new MutationObserver(() => {
    disableDeleteButtons();
    setupRawProtector();
    setImageQualityTo100();
    hideAllSettings();
});

if (document.body) {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    runAll();
    document.body.addEventListener('click', globalClickBlocker, true);
    
    setInterval(() => {
        setImageQualityTo100();
        hideAllSettings();
    }, 3000);
}

console.log('[CVAT] Shield активен');

}