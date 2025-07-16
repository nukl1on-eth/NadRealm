const gallery = document.getElementById('gallery');

const CONFIG = {
  ITEMS_PER_PAGE: 10,
  MOBILE_BREAKPOINT: 768,
  LOADING_DELAY: 700,
  ESC_HINT_TIMEOUT: 2500,
  CARD_CLOSE_TIMEOUT: 400,
  FAB_ANIMATION_TIMEOUT: 800,
  SEARCH_DEBOUNCE_DELAY: 200,
  SCROLL_THRESHOLD: 500,
  CONTENT_ANIMATION_DELAY: 10,
  DISCLAIMER_DELAY: 450,
  FLOATING_INITIAL_DELAY: 1000,
  SNEAK_HIDE_DELAY: 350
};

let openedCardIds = [];
let currentTag = 'all';
let showRating = false;
let sortMode = 'none';
let disclaimerAccepted = localStorage.getItem('disclaimerAccepted') === 'true';
let currentPage = 1;
let hasMoreItems = true;
let isLoading = false;
let pendingWebsiteUrl = '';
let sneakPeaksArr = [];
let sneakPeaksIdx = 0;

const sortBtn = document.getElementById('sort-dropdown-btn');
const sortMenu = document.getElementById('sort-dropdown-menu');

      sortBtn.onclick = function(e) {
        e.stopPropagation();
        const isOpen = sortMenu.style.display === 'block';
        sortMenu.style.display = isOpen ? 'none' : 'block';
      };

function isMobileDevice() {
  return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
}

function updateSortMenu() {
  document.querySelectorAll('.sort-rating').forEach(opt => {
    if (showRating) {
      opt.classList.remove('disabled-sort');
      opt.style.pointerEvents = 'auto';
      opt.style.display = '';
    } else {
      opt.classList.add('disabled-sort');
      opt.style.pointerEvents = 'none';
      opt.style.display = '';
    }
  });
}
function updateUI() {
  resetPagination();
  renderGallery();
  updateSortMenu();
}
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const debouncedSearchUpdate = debounce(updateUI, CONFIG.SEARCH_DEBOUNCE_DELAY);

      document.addEventListener('click', function(e) {
        if (!sortMenu.contains(e.target) && e.target !== sortBtn) {
          sortMenu.style.display = 'none';
        }
      });

sortMenu.querySelectorAll('.sort-option').forEach(option => {
  option.onclick = function(e) {
    if (this.classList.contains('disabled-sort')) return;
    e.stopPropagation();
    sortMode = this.dataset.sort;
    sortMenu.style.display = 'none';
    const openCard = document.querySelector('.card.open');
    if (openCard) {
    closeCard(openCard, openCard.dataset.id);
      setTimeout(() => {
        updateUI(); 
      }, CONFIG.DISCLAIMER_DELAY);
    } else {
      updateUI();
    }
  };
});


const getBannerUrl = username => username ? `https://x.com/${username}/header_photo` : 'https://abs.twimg.com/images/themes/theme1/bg.png';

function renderGallery(append = false) {
  
  const projectsData = window.filteredProjects || window.projects;
  document.getElementById('projects-count').textContent = window.projects.length;
  
  if (!append) {
   while (gallery.firstChild) {
    gallery.removeChild(gallery.firstChild);
   }
  }
  
  let projectsToShow = projectsData.slice();

  if (sortMode === 'az') {
    projectsToShow.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortMode === 'za') {
    projectsToShow.sort((a, b) => b.title.localeCompare(a.title));
  } else if (sortMode === 'rating-asc') {
    projectsToShow.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  } else if (sortMode === 'rating-desc') {
    projectsToShow.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (currentTag !== 'all') {
    projectsToShow = projectsToShow.filter(project => 
      project.tags && project.tags.includes(currentTag)
    );
  }

const itemsToShow = currentPage * CONFIG.ITEMS_PER_PAGE;
const currentPageProjects = append 
  ? projectsToShow.slice((currentPage - 1) * CONFIG.ITEMS_PER_PAGE, currentPage * CONFIG.ITEMS_PER_PAGE)
  : projectsToShow.slice(0, itemsToShow);

hasMoreItems = itemsToShow < projectsToShow.length;

  for (const project of currentPageProjects) {
    const imgUrl = project.image || getBannerUrl(project.twitterUsername);
    const isOpen = openedCardIds.includes(project.id);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = project.id;
    
    card.innerHTML = `
      <div class="banner-wrapper">
${showRating && project.rating ? `
  <div class="card-rating">
    ${'⭐'.repeat(project.rating)}
  </div>
` : ''}
        <img class="banner" src="${imgUrl}" alt="${project.title}">
      </div>
      ${ project.tags ? `
        <div class="project-tags">
          ${project.tags.map(tag => `<span class="project-tag" onclick="event.stopPropagation(); filterByTag('${tag}');">${tag}</span>`).join('')}
        </div>
      ` : '' }
      <img class="avatar" src="${project.avatar || 'default_avatar.png'}" alt="${project.title} avatar">
      <div class="card-title">${project.title}</div>
      <div class="mini-description">${project.shortDescription || ''}</div>
      <div class="card-content">
        <div class="section-title general-info-title">• General Info</div>
        <div class="card-desc-block">
          <div class="card-desc">
            ${project.description || ''}
          </div>
        </div>
        <div class="founder-blocks">
          ${ project.founderTwitter ? `
              <div class="section-title founder-title">• Founder</div>
              <div class="founder-block" onclick="event.stopPropagation(); event.stopImmediatePropagation(); window.open('https://twitter.com/${project.founderTwitter}', '_blank'); return false;" style="cursor:pointer;">
                <img src="https://unavatar.io/twitter/${project.founderTwitter}" alt="@${project.founderTwitter}">
                <div>
                  <div class="founder-name">@${project.founderTwitter}</div>
                  <div class="founder-desc">${project.founderDesc || ''}</div>
                </div>
              </div>
              ${project.extraText ? `<div class="founder-extra">${project.extraText}</div>` : ''}
          ` : ''}
          ${ Array.isArray(project.founders) ? `
              <div class="section-title founder-title">• Founders</div>
              ${project.founders.map(f => `
                <div class="founder-block" onclick="window.open('https://twitter.com/${f.twitter}', '_blank')" style="cursor:pointer;">
                  <img src="https://unavatar.io/twitter/${f.twitter}" alt="@${f.twitter}">
                  <div>
                    <div class="founder-name">@${f.twitter}</div>
                    <div class="founder-desc">${f.desc || ''}</div>
                    ${f.extraText ? `<div class="founder-extra">${f.extraText}</div>` : ''}
                  </div>
                </div>
              `).join('')}
          ` : ''}
        </div>
        ${ project.collectionInfo ? `
          <div class="section-title">• Testnet Collections</div>
          ${ Array.isArray(project.collectionInfo)
              ? project.collectionInfo.map(info => `
                  <div class="collection-block" onclick="event.stopPropagation(); window.open('${info.link || '#'}', '_blank')">
                    <img src="${info.avatar || 'default_avatar.png'}" alt="${info.name}"
                         style="width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:#222;">
                    <div>
                      <div style="font-weight:600;color:#8247e5;font-size:1.05em;">${info.name || ''}</div>
                      <div style="font-size:0.98em;color:#fff;">${info.desc || ''}</div>
                    </div>
                  </div>
                `).join('') : `
                  <div class="collection-block" onclick="window.open('${project.collectionInfo.link || '#'}', '_blank')">
                    <img src="${project.collectionInfo.avatar || 'default_avatar.png'}" alt="${project.collectionInfo.name}"
                         style="width:40px;height:40px;border-radius:50%;border:2px solid #fff;background:#222;">
                    <div>
                      <div style="font-weight:600;color:#8247e5;font-size:1.05em;">${project.collectionInfo.name || ''}</div>
                      <div style="font-size:0.98em;color:#fff;">${project.collectionInfo.desc || ''}</div>
                    </div>
                  </div>
                `
          }
        ` : ''}
        ${ project.sneakPeaks && project.sneakPeaks.length ? `
          <div class="sneak-peaks-block">
            <div class="sneak-peaks-title">• Sneak Peaks</div>
            <div class="sneak-peaks-list">
              ${project.sneakPeaks.map(img => 
                `<img src="${img}" alt="Sneak Peak" class="sneak-peak-img" onclick="event.stopPropagation(); event.stopImmediatePropagation(); showSneakModal('${img}')">`
              ).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="card-footer">
        <div class="card-links-divider"></div>
        <div class="links always-visible">
          <a href="${project.links.twitter}" target="_blank">
            <svg class="social-ico" viewBox="0 0 24 24" width="20" height="20" fill="#fff" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.53 3H21L14.47 10.39L22.24 21H16.16L11.38 14.67L5.99998 21H2.52998L9.52998 13.09L2.00001 3H8.23998L12.57 8.74L17.53 3ZM16.38 19H18.08L7.71998 4.89H5.88998L16.38 19Z"/>
            </svg>
            Twitter
          </a>
          ${project.links.discord ? `
          <a href="${project.links.discord}" target="_blank">
            <svg class="social-ico" viewBox="0 0 24 24" width="20" height="20" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.1a.112.112 0 0 0-.119.056c-.523.927-1.105 2.13-1.516 3.084a17.978 17.978 0 0 0-5.034 0c-.412-.954-.994-2.157-1.516-3.084a.115.115 0 0 0-.119-.056A19.736 19.736 0 0 0 3.683 4.369a.104.104 0 0 0-.047.043C.533 9.045-.32 13.579.099 18.057a.117.117 0 0 0 .045.082c2.053 1.507 4.042 2.422 5.993 3.029a.112.112 0 0 0 .123-.041c.462-.63.874-1.295 1.226-1.994a.112.112 0 0 0-.061-.155c-.652-.247-1.272-.548-1.872-.892a.112.112 0 0 1-.011-.186c.126-.094.252-.19.374-.287a.112.112 0 0 1 .114-.013c3.927 1.793 8.18 1.793 12.061 0a.112.112 0 0 1 .115.013c.122.098.248.193.374.287a.112.112 0 0 1-.011.186c-.6.344-1.22.645-1.872.892a.112.112 0 0 0-.061.155c.36.699.773 1.364 1.226 1.994a.112.112 0 0 0 .123.041c1.951-.607 3.94-1.522 5.993-3.029a.112.112 0 0 0 .045-.082c.5-5.177-.838-9.673-3.573-13.645a.104.104 0 0 0-.047-.043ZM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.094 2.156 2.418 0 1.334-.955 2.419-2.156 2.419Zm7.974 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419Z"/>
        </svg>
        Discord
      </a>
      ` : ''}
      ${project.links.telegram ? `
      <a href="${project.links.telegram}" target="_blank">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" style="width:20px; height:20px; fill:#0088cc;">
    <path d="M248 8C111 8 0 119 0 256S111 504 248 504 496 393 496 256 385 8 248 8zM363 176.7c-3.7 39.2-19.9 134.4-28.1 178.3-3.5 18.6-10.3 24.8-16.9 25.4-14.4 1.3-25.3-9.5-39.3-18.7-21.8-14.3-34.2-23.2-55.3-37.2-24.5-16.1-8.6-25 5.3-39.5 3.7-3.8 67.1-61.5 68.3-66.7 .2-.7 .3-3.1-1.2-4.4s-3.6-.8-5.1-.5q-3.3 .7-104.6 69.1-14.8 10.2-26.9 9.9c-8.9-.2-25.9-5-38.6-9.1-15.5-5-27.9-7.7-26.8-16.3q.8-6.7 18.5-13.7 108.4-47.2 144.6-62.3c68.9-28.6 83.2-33.6 92.5-33.8 2.1 0 6.6 .5 9.6 2.9a10.5 10.5 0 0 1 3.5 6.7A43.8 43.8 0 0 1 363 176.7z"/>
  </svg>
        Telegram
      </a>
      ` : ''}
      ${project.links.website ? `
      <a href="#" onclick="showWebsiteDisclaimer('${project.links.website}'); return false;">
        <svg class="social-ico" viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#fff" stroke-width="2"/>
          <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#fff" stroke-width="2"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="#fff" stroke-width="2"/>
        </svg>
        Website
      </a>
      ` : ''}
        </div>
      </div>
    `;

    gallery.appendChild(card);
    
    card.querySelectorAll('.links.always-visible a').forEach(link => {
     link.addEventListener('click', e => {
       e.stopPropagation();
    });
    });
    
    const miniDesc = card.querySelector('.mini-description');
    if (!isOpen) {
      miniDesc && miniDesc.classList.add('mini-description--visible');
    } else {
      miniDesc && miniDesc.classList.remove('mini-description--visible');
    }

    if (isOpen) {
      setTimeout(() => {
        card.classList.add('open');
      }, CONFIG.CONTENT_ANIMATION_DELAY);
    }
    
    if (card.classList.contains('closing')) {
      setTimeout(() => {
        card.classList.remove('closing');
      }, CONFIG.CARD_CLOSE_TIMEOUT + 100);
    }
    
    card.onclick = (event) => {
      if (event.target.closest('.founder-block')) return;
      if (card.classList.contains('open')) {
        closeCard(card, project.id);
      } else {
        openCard(card, project.id);
      }
    };
  }
}

function loadMoreCards() {

  if (isLoading || !hasMoreItems) return;

  isLoading = true;
  
  const loadingElement = document.getElementById('loading-animation');
  if (loadingElement) {
    loadingElement.style.display = 'flex';
    loadingElement.classList.add('active');
  }
  
  currentPage++;

  setTimeout(() => {
    renderGallery(true);
    if (loadingElement) {
      loadingElement.style.display = 'none';
      loadingElement.classList.remove('active');
    }
    
    isLoading = false;
  },  CONFIG.LOADING_DELAY);
}

function resetPagination() {
  currentPage = 1;
  hasMoreItems = true;
  isLoading = false;
}

function openCard(card, projectId) {
  const openCard = document.querySelector('.card.open');
  if (openCard && openCard !== card) {
    closeCard(openCard, openCard.dataset.id);
  }
  card.classList.add('open');
  card.querySelector('.mini-description')?.classList.remove('mini-description--visible');
  openedCardIds = [projectId];

  const content = card.querySelector('.card-content');

  setTimeout(() => {
    content.style.maxHeight = '1000px';
    content.style.opacity = '1';
    content.style.visibility = 'visible';
  }, CONFIG.CONTENT_ANIMATION_DELAY);
}


function closeCard(card, projectId) {
  card.classList.add('closing');
  card.classList.remove('open');
  card.querySelector('.mini-description')?.classList.remove('mini-description--visible');

  const content = card.querySelector('.card-content');
  content.style.opacity = '0';
  content.style.maxHeight = '0';

  setTimeout(() => {
    card.classList.remove('closing');
    openedCardIds = [];
    card.querySelector('.mini-description')?.classList.add('mini-description--visible');
  }, CONFIG.CARD_CLOSE_TIMEOUT);
}

function showEscHint() {
  const hint = document.getElementById('esc-hint');
  if (!hint || isMobileDevice()) return;
  
  hint.style.display = 'block';
  setTimeout(() => { hint.style.opacity = '1'; }, CONFIG.CONTENT_ANIMATION_DELAY);
  
  clearTimeout(hint._escTimeout);
  hint._escTimeout = setTimeout(() => {
    hint.style.opacity = '0';
    setTimeout(() => { hint.style.display = 'none'; }, CONFIG.SNEAK_HIDE_DELAY);
  }, CONFIG.ESC_HINT_TIMEOUT);
}

function filterByTag(tag) {
  currentTag = tag;
  
  const tagsCloseBtn = document.getElementById('tags-close-btn');
  if (tagsCloseBtn) {

   if (tag !== 'all' && isMobileDevice()) {
      tagsCloseBtn.classList.add('active');
    } else {
      tagsCloseBtn.classList.remove('active');
    }
  }
  
  const openCard = document.querySelector('.card.open');
  if (openCard) {
    const projectId = openCard.dataset.id;
    closeCard(openCard, projectId);
    setTimeout(updateUI, CONFIG.CARD_CLOSE_TIMEOUT);
  } else {
    updateUI();
  }
  if (tag !== 'all') {
    showEscHint();
  }
}

window.addEventListener('resize', () => {
  const tagsCloseBtn = document.getElementById('tags-close-btn');
  if (!tagsCloseBtn) return;
  
  if (isMobileDevice() && currentTag !== 'all') {
    tagsCloseBtn.classList.add('active');
  } else {
    tagsCloseBtn.classList.remove('active');
  }
});

const handleScroll = () => {
  const { scrollTop, scrollHeight } = document.documentElement;
  if (scrollTop + window.innerHeight >= scrollHeight - CONFIG.SCROLL_THRESHOLD) {
    loadMoreCards();
  }
};

let scrollThrottle;
window.addEventListener('scroll', () => {
  if (scrollThrottle) return;
  scrollThrottle = requestAnimationFrame(() => {
    handleScroll();
    scrollThrottle = null;
  });
});

function initSearchInput() {
  const searchInput = document.getElementById('project-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('focus', function(e) {
    const openCard = document.querySelector('.card.open');
    if (openCard) {
      closeCard(openCard, openCard.dataset.id);
    }
  });

  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim().toLowerCase();
    if (Array.isArray(window.projects)) {
      window.filteredProjects = window.projects.filter(project =>
        project.title.toLowerCase().includes(query)
      );
      debouncedSearchUpdate(); 
    }
  });
}

function initFloatingButtons() {
  const floatingButtons = document.querySelector('.floating-buttons');
  if (floatingButtons) {
    floatingButtons.classList.add('initial');
    setTimeout(() => {
      floatingButtons.classList.remove('initial');
    }, CONFIG.FLOATING_INITIAL_DELAY);
  }
}

function initTagsButton() {
  const tagsCloseBtn = document.getElementById('tags-close-btn');
  if (!tagsCloseBtn) return;
  
  tagsCloseBtn.onclick = function(e) {
    e.stopPropagation();
    if (currentTag !== 'all') {
      currentTag = 'all';
      tagsCloseBtn.classList.remove('active'); 
      updateUI();
    }
  };
}

function initProjectsCounter() {
  const projectsCounter = document.getElementById('projects-count');
  const projectsCounterContainer = projectsCounter?.parentElement;
  
  if (!projectsCounterContainer) return;
  
  projectsCounterContainer.style.cursor = 'pointer';
  projectsCounterContainer.title = 'Click to reset filters';
  
  projectsCounterContainer.onclick = function(e) {
    e.stopPropagation();
    
    let hasChanges = false;
    
    if (currentTag !== 'all') {
      currentTag = 'all';
      const tagsCloseBtn = document.getElementById('tags-close-btn');
      if (tagsCloseBtn) {
        tagsCloseBtn.classList.remove('active');
      }
      hasChanges = true;
    }
    
    if (sortMode !== 'none') {
      sortMode = 'none';
      hasChanges = true;
    }
    
    const searchInput = document.getElementById('project-search');
    if (searchInput && searchInput.value.trim()) {
      searchInput.value = '';
      window.filteredProjects = null;
      hasChanges = true;
    }
    
    if (hasChanges) {
      const openCard = document.querySelector('.card.open');
      if (openCard) {
        closeCard(openCard, openCard.dataset.id);
        setTimeout(() => {
          updateUI();
        }, CONFIG.CARD_CLOSE_TIMEOUT);
      } else {
        updateUI();
      }
    }
  };
}


function initSneakClose() {
  const sneakClose = document.getElementById('sneak-close');
  if (!sneakClose) return;
  
  sneakClose.onclick = function(e) {
    e.stopPropagation();
    closeSneakModal();
  };
}
function initToggleSwitch() {
  const toggleSwitch = document.getElementById('toggle-rating-switch');
  if (!toggleSwitch) return;
  
  toggleSwitch.checked = showRating;

  toggleSwitch.onchange = function() {
    const openCard = document.querySelector('.card.open');
    if (this.checked) {
      this.checked = false;
      if (openCard) {
        closeCard(openCard, openCard.dataset.id);
        setTimeout(() => {
          document.getElementById('rating-disclaimer-modal').style.display = 'flex';
        }, CONFIG.DISCLAIMER_DELAY);
      } else {
        document.getElementById('rating-disclaimer-modal').style.display = 'flex';
      }
      return;
    }
    
    showRating = this.checked;
    
    if (openCard) {
      closeCard(openCard, openCard.dataset.id);
      setTimeout(() => {
        updateUI();
      }, CONFIG.DISCLAIMER_DELAY);
    } else {
      updateUI();
    }
  };
}

function initDisclaimer() {
  const disclaimerContinue = document.getElementById('disclaimer-continue');
  const disclaimerCancel = document.getElementById('disclaimer-cancel');
  
  if (!disclaimerContinue || !disclaimerCancel) return;
  
  disclaimerContinue.onclick = function(e) {
    e.stopPropagation();
    disclaimerAccepted = true;
    localStorage.setItem('disclaimerAccepted', 'true');
    document.getElementById('rating-disclaimer-modal').style.display = 'none';
    
    const toggleSwitch = document.getElementById('toggle-rating-switch');
    if (toggleSwitch) {
      toggleSwitch.checked = true;
    }
    
    showRating = true;
    updateUI();
  };
  
  disclaimerCancel.onclick = function(e) {
    e.stopPropagation();
    document.getElementById('rating-disclaimer-modal').style.display = 'none';
    
    const toggleSwitch = document.getElementById('toggle-rating-switch');
    if (toggleSwitch) {
      toggleSwitch.checked = false;
    }
    
    showRating = false;
  };
}

function initSneakNavigation() {
  const sneakPrev = document.getElementById('sneak-prev');
  const sneakNext = document.getElementById('sneak-next');
  
  if (sneakPrev) {
    sneakPrev.onclick = function(e) {
      e.stopPropagation();
      if (sneakPeaksArr.length === 0) return;
      
      sneakPeaksIdx = sneakPeaksIdx > 0 ? sneakPeaksIdx - 1 : sneakPeaksArr.length - 1;
      updateSneakModal();
    };
  }
  
  if (sneakNext) {
    sneakNext.onclick = function(e) {
      e.stopPropagation();
      if (sneakPeaksArr.length === 0) return;
      
      sneakPeaksIdx = sneakPeaksIdx < sneakPeaksArr.length - 1 ? sneakPeaksIdx + 1 : 0;
      updateSneakModal();
    };
  }
}

function initKeyboardHandlers() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const modal = document.getElementById('sneak-modal');
      if (modal && modal.classList.contains('active')) {
        closeSneakModal();
        event.stopPropagation();
        return;
      }
      
      if (currentTag !== 'all') {
        currentTag = 'all';
        const tagsCloseBtn = document.getElementById('tags-close-btn');
        if (tagsCloseBtn) {
          tagsCloseBtn.classList.remove('active');
        }
        updateUI();
      }
    }
  });
}

window.showWebsiteDisclaimer = function(url) {
  pendingWebsiteUrl = url;
  const modal = document.getElementById('website-disclaimer-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
};

function initModals() {
  document.getElementById('sneak-modal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeSneakModal();
    }
  });

  document.getElementById('website-disclaimer-continue').onclick = function(e) {
    e.stopPropagation();
    const modal = document.getElementById('website-disclaimer-modal');
    modal.style.display = 'none';
    window.open(pendingWebsiteUrl, '_blank');
  };
}

document.addEventListener('DOMContentLoaded', () => {
  renderGallery(); 
  updateSortMenu();
  
  initSearchInput();
  initFloatingButtons();
  initTagsButton();
  initSneakClose();
  initToggleSwitch();
  initDisclaimer();
  initSneakNavigation();
  initKeyboardHandlers();
  initModals();
  initProjectsCounter();
});

function showSneakModal(img) {
  const allProjects = window.projects;
  for (const project of allProjects) {
    if (project.sneakPeaks && project.sneakPeaks.includes(img)) {
      sneakPeaksArr = project.sneakPeaks;
      sneakPeaksIdx = project.sneakPeaks.indexOf(img);
      break;
    }
  }
  updateSneakModal();
  
  toggleFabButtons(false);
  
  const modal = document.getElementById('sneak-modal');
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function updateSneakModal() {
  const modalImg = document.getElementById('sneak-modal-img');
  const indicator = document.getElementById('sneak-indicator');
  modalImg.src = sneakPeaksArr[sneakPeaksIdx];
  indicator.textContent = `${sneakPeaksIdx + 1} / ${sneakPeaksArr.length}`;
}

function closeSneakModal() {
  const modal = document.getElementById('sneak-modal');
  modal.classList.remove('active');
  modal.style.display = 'none';
  toggleFabButtons(true);
}

function toggleFabButtons(show = true) {
  const floatingButtons = document.querySelector('.floating-buttons');
  if (!floatingButtons) return;
  
  if (show && floatingButtons.classList.contains('hidden')) {
    const secondFab = floatingButtons.querySelector('.fab:nth-child(2)');
    if (secondFab) {
      secondFab.style.transform = 'translateX(100px)';
      secondFab.style.opacity = '0';
    }
    
    floatingButtons.classList.remove('hidden');
    floatingButtons.classList.add('show');
    
    setTimeout(() => {
      floatingButtons.classList.remove('show');
      if (secondFab) {
        secondFab.style.transform = '';
        secondFab.style.opacity = '';
      }
    }, CONFIG.FAB_ANIMATION_TIMEOUT);
    
  } else if (!show && !floatingButtons.classList.contains('hidden')) {
    floatingButtons.classList.remove('show', 'initial');
    floatingButtons.classList.add('hidden');
  }
}