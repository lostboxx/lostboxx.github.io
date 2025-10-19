const elements={
    mainMenu:document.getElementById('mainMenu'),
    profilePage:document.getElementById('profilePage'),
    toolsFrame:document.getElementById('toolsFrame'),
    gamesFrame:document.getElementById('gamesFrame'),
    newsFrame:document.getElementById('newsFrame'),
    guestbookFrame:document.getElementById('guestbookFrame'),
    toolsFrameContainer:document.getElementById('toolsFrameContainer'),
    gamesFrameContainer:document.getElementById('gamesFrameContainer'),
    newsFrameContainer:document.getElementById('newsFrameContainer'),
    guestbookFrameContainer:document.getElementById('guestbookFrameContainer'),
    mainAvatar:document.getElementById('mainAvatar'),
    mainUsername:document.getElementById('mainUsername'),
    profileAvatar:document.getElementById('profileAvatar'),
    profileUsername:document.getElementById('profileUsername'),
    usernameInput:document.getElementById('usernameInput'),
    avatarInput:document.getElementById('avatarInput'),
    musicBtn:document.getElementById('musicBtn'),
    musicIcon:document.getElementById('musicIcon'),
    bgMusic:document.getElementById('bgMusic'),
    mainToolbar:document.getElementById('mainToolbar'),
    mainBottomBar:document.getElementById('mainBottomBar'),
    contentBox:document.getElementById('contentBox'),
    backBtn:document.getElementById('backBtn'),
    pageTitle:document.getElementById('pageTitle'),
    confirmModal:document.getElementById('confirmModal'),
    newsBtn:document.getElementById('newsBtn'),
    newsIcon:document.getElementById('newsIcon'),
    profileBackBtn:document.getElementById('profileBackBtn'),
    changeAvatarBtn:document.getElementById('changeAvatarBtn'),
    saveProfileBtn:document.getElementById('saveProfileBtn'),
    repairBtn:document.getElementById('repairBtn'),
    profilePrivateBtn:document.getElementById('profilePrivateBtn'),
    privateFolderFullscreen:document.getElementById('privateFolderFullscreen'),
    privateFolderFrame:document.getElementById('privateFolderFrame'),
    welcomeElement:document.getElementById('welcomeinlostbox')
};
const dbName="LostBoxDB";
const storeName="profile";
let db=null;
let musicPlaying=false;
let iconInterval=null;
let currentFrame=1;
let currentAvatar=null;
let wasMusicPlaying=false;
let hasUnsavedChanges=false;
let newsOpen=false;
let guestbookOpen=false;
let guestbookTimer=null;
let privateFolderOpen=false;
let cameFromPrivateFolder=false;
let isPanelMode=false;
let policyIframe=null;
const TUTORIAL_DB_NAME = 'LostBoxMainDB';
const TUTORIAL_STORE_NAME = 'tutorialViews';
const POLICY_TUTORIAL_KEY = 'policyHintCount';
function initWelcomeMessage(){
    console.log("initWelcomeMessage called");
    if(!elements.welcomeElement){
        console.error("Welcome element not found");
        return
    }
    const LAST_VISIT_KEY='lastVisitDate';
    const WELCOME_PHRASE_KEY='lastWelcomePhrase';
    const timePhrases={
        morning:['Доброе утро! 🌅','Добро пожаловать! 👋'],
        day:['Добрый день! 🌞','Добро пожаловать! 👋'],
        evening:['Добрый вечер! 🌄','Добро пожаловать! 👋'],
        night:['Доброй ночи! 🌙','Добро пожаловать! 👋'],
        default:['Добро пожаловать! 👋']
    };
    const returnPhrases={
        twoDays:['Добро пожаловать, снова! 👋','Рады вас видеть! 😊'],
        moreDays:['Долго не виделись! 😃','Добро пожаловать, снова! 😊']
    };
    const now=new Date();
    const currentHour=now.getHours();
    const lastVisitDate=localStorage.getItem(LAST_VISIT_KEY);
    const lastVisit=lastVisitDate?new Date(lastVisitDate):null;
    let daysDiff=0;
    if(lastVisit){
        const timeDiff=now.getTime()-lastVisit.getTime();
        daysDiff=Math.floor(timeDiff/(1000*3600*24))
    }
    let selectedPhrase;
    if(daysDiff>2){
        selectedPhrase=returnPhrases.moreDays[Math.floor(Math.random()*returnPhrases.moreDays.length)]
    }else if(daysDiff===2){
        selectedPhrase=returnPhrases.twoDays[Math.floor(Math.random()*returnPhrases.twoDays.length)]
    }else{
        let timePeriod;
        if(currentHour>=5&&currentHour<12){
            timePeriod='morning'
        }else if(currentHour>=12&&currentHour<17){
            timePeriod='day'
        }else if(currentHour>=17&&currentHour<23){
            timePeriod='evening'
        }else{
            timePeriod='night'
        }
        const phrases=timePhrases[timePeriod]||timePhrases.default;
        selectedPhrase=phrases[Math.floor(Math.random()*phrases.length)]
    }
    elements.welcomeElement.textContent=selectedPhrase;
    localStorage.setItem(LAST_VISIT_KEY,now.toISOString())
}
function createConfirmModal(){
    const modal=document.createElement('div');
    modal.className='modal';
    modal.innerHTML=`<div class="modal-content"><p>Данные могут не сохраниться. Сохранить профиль?</p><div class="modal-buttons"><button id="confirmSaveBtn">Да</button><button id="confirmCancelBtn">Нет</button></div></div>`;
    elements.confirmModal.appendChild(modal);
    elements.confirmSaveBtn=document.getElementById('confirmSaveBtn');
    elements.confirmCancelBtn=document.getElementById('confirmCancelBtn')
}
function setDefaultProfileValues(){
    console.log("Setting default profile values");
    const defaultUsername="Банка";
    if(elements.mainUsername){
        elements.mainUsername.textContent=defaultUsername;
        console.log("Main username set to default")
    }
    if(elements.profileUsername){
        elements.profileUsername.textContent=defaultUsername;
        console.log("Profile username set to default")
    }
    if(elements.usernameInput){
        elements.usernameInput.value=defaultUsername;
        console.log("Username input set to default")
    }
    if(elements.mainAvatar){
        elements.mainAvatar.style.backgroundImage='';
        elements.mainAvatar.textContent='🫙'
    }
    if(elements.profileAvatar){
        elements.profileAvatar.style.backgroundImage='';
        elements.profileAvatar.textContent='🫙'
    }
    currentAvatar=null
}
function initDB(){
    console.log("initDB called");
    const request=indexedDB.open(dbName,1);
    request.onupgradeneeded=(e)=>{
        db=e.target.result;
        if(!db.objectStoreNames.contains(storeName)){
            db.createObjectStore(storeName,{keyPath:"id"});
            console.log("Database store created")
        }
    };
    request.onsuccess=(e)=>{
        db=e.target.result;
        console.log("Database opened successfully");
        loadProfile()
    };
    request.onerror=(e)=>{
        console.error("DB error:",e.target.error);
        setDefaultProfileValues()
    }
}
function loadProfile(){
    if(!db){
        console.error("Database not initialized in loadProfile");
        setDefaultProfileValues();
        return
    }
    const transaction=db.transaction([storeName],"readonly");
    const store=transaction.objectStore(storeName);
    const request=store.get(1);
    request.onsuccess=(e)=>{
        const data=e.target.result;
        console.log("Profile data loaded:",data);
        if(data){
            if(elements.mainUsername){
                elements.mainUsername.textContent=data.username;
                console.log("Main username loaded:",data.username)
            }
            if(elements.profileUsername){
                elements.profileUsername.textContent=data.username;
                console.log("Profile username loaded:",data.username)
            }
            if(elements.usernameInput){
                elements.usernameInput.value=data.username;
                console.log("Username input loaded:",data.username)
            }
            if(data.avatar){
                if(elements.mainAvatar){
                    elements.mainAvatar.style.backgroundImage=`url(${data.avatar})`;
                    elements.mainAvatar.textContent='';
                    console.log("Main avatar loaded")
                }
                if(elements.profileAvatar){
                    elements.profileAvatar.style.backgroundImage=`url(${data.avatar})`;
                    elements.profileAvatar.textContent='';
                    console.log("Profile avatar loaded")
                }
                currentAvatar=data.avatar
            }else{
                console.log("No avatar in profile data")
            }
        }else{
            console.log("No profile data found, setting defaults");
            setDefaultProfileValues()
        }
    };
    request.onerror=(e)=>{
        console.error("Error loading profile:",e.target.error);
        setDefaultProfileValues()
    }
}
function saveProfile(){
    if(!db){
        console.error("Database not initialized in saveProfile");
        return
    }
    const username=elements.usernameInput?.value||"Банка";
    const transaction=db.transaction([storeName],"readwrite");
    const store=transaction.objectStore(storeName);
    store.put({id:1,username,avatar:currentAvatar});
    if(elements.mainUsername)elements.mainUsername.textContent=username;
    if(elements.profileUsername)elements.profileUsername.textContent=username;
    hasUnsavedChanges=false;
    console.log("Profile saved:",username)
}
function changeAvatar(){
    if(elements.avatarInput){
        elements.avatarInput.click()
    }else{
        console.error("Avatar input element not found")
    }
}
if(elements.avatarInput){
    elements.avatarInput.addEventListener('change',(e)=>{
        const file=e.target.files[0];
        if(!file)return;
        const reader=new FileReader();
        reader.onload=(event)=>{
            currentAvatar=event.target.result;
            if(elements.mainAvatar){
                elements.mainAvatar.style.backgroundImage=`url(${currentAvatar})`;
                elements.mainAvatar.textContent=''
            }
            if(elements.profileAvatar){
                elements.profileAvatar.style.backgroundImage=`url(${currentAvatar})`;
                elements.profileAvatar.textContent=''
            }
            hasUnsavedChanges=true;
            console.log("Avatar changed")
        };
        reader.readAsDataURL(file)
    })
}else{
    console.error("Avatar input element not found for event listener")
}
function showProfile(){
    console.log("showProfile called");
    if(!elements.profilePage){
        console.error("Profile page element not found!");
        return
    }
    if(!elements.contentBox){
        console.error("Content box element not found!");
        return
    }
    console.log("Hiding other containers...");
    const frameContainers=['toolsFrameContainer','gamesFrameContainer','newsFrameContainer','guestbookFrameContainer'];
    frameContainers.forEach(containerId=>{
        if(elements[containerId]){
            elements[containerId].style.display='none';
            console.log(`Hidden: ${containerId}`)
        }
    });
    if(elements.mainMenu){
        elements.mainMenu.style.display='none';
        console.log("Hidden: mainMenu")
    }
    elements.contentBox.style.display='block';
    console.log("Content box set to display: block");
    elements.profilePage.style.display='flex';
    console.log("Profile page set to display: flex");
    if(elements.mainToolbar){
        elements.mainToolbar.style.display='flex';
        elements.mainToolbar.style.background='linear-gradient(to right, #1168c2, #0d5aa6, #1168c2)'
    }
    if(elements.mainBottomBar){
        elements.mainBottomBar.style.display='flex';
        elements.mainBottomBar.style.background='linear-gradient(to right, #1168c2, #0d5aa6, #1168c2)'
    }
    hasUnsavedChanges=false;
    if(elements.newsBtn){
        elements.newsBtn.style.display='none'
    }
    if(cameFromPrivateFolder){
        if(elements.backBtn)elements.backBtn.style.display='none';
        cameFromPrivateFolder=false
    }
    if(elements.privateFolderFullscreen){
        elements.privateFolderFullscreen.style.display='none'
    }
    privateFolderOpen=false;
    if(elements.pageTitle){
        elements.pageTitle.textContent="Профиль"
    }
    console.log("Profile page should be fully visible now")
}
function hideProfile(){
    console.log("hideProfile called");
    if(elements.profilePage){
        elements.profilePage.style.display='none'
    }
    if(elements.mainMenu){
        elements.mainMenu.style.display='flex'
    }
    if(elements.confirmModal&&elements.confirmModal.firstChild){
        elements.confirmModal.firstChild.style.display='none'
    }
    if(elements.newsBtn){
        elements.newsBtn.style.display='block'
    }
    if(elements.pageTitle){
        elements.pageTitle.textContent="LostBox"
    }
    if(elements.contentBox){
        elements.contentBox.style.display='flex'
    }
}
function saveAndHideProfile(){
    saveProfile();
    hideProfile()
}
function checkUnsavedChanges(){
    const usernameChanged=elements.usernameInput&&elements.profileUsername&&elements.usernameInput.value!==elements.profileUsername.textContent;
    if(hasUnsavedChanges||usernameChanged){
        if(elements.confirmModal&&elements.confirmModal.firstChild){
            elements.confirmModal.firstChild.style.display='flex'
        }
    }else{
        hideProfile()
    }
}
function repairLostBox(){
    if(confirm("Починить LostBox? Это удалит аватарку и имя.")){
        try{
            indexedDB.deleteDatabase(dbName);
            localStorage.removeItem("guestbookVisited");
            alert("LostBox починен, перезагрузите страницу!")
        }catch(e){
            console.error("Repair error:",e)
        }
    }
}
function loadTool(src,title="LostBox",hidePanels=false,isGame=false){
    console.log("loadTool:",src);
    wasMusicPlaying=musicPlaying;
    toggleMusic(false);
    if(elements.pageTitle)elements.pageTitle.textContent=title;
    if(elements.backBtn)elements.backBtn.style.display='block';
    if(elements.contentBox)elements.contentBox.style.display='none';
    if(elements.newsBtn)elements.newsBtn.style.display='none';
    if(hidePanels){
        if(elements.mainToolbar)elements.mainToolbar.style.display='none';
        if(elements.mainBottomBar)elements.mainBottomBar.style.display='none'
    }else{
        if(elements.mainToolbar)elements.mainToolbar.style.display='flex';
        if(elements.mainBottomBar)elements.mainBottomBar.style.display='flex'
    }
    if(isGame){
        if(elements.gamesFrameContainer)elements.gamesFrameContainer.style.display='block';
        if(elements.gamesFrame){
            elements.gamesFrame.style.display='block';
            elements.gamesFrame.src=src
        }
        if(elements.toolsFrameContainer)elements.toolsFrameContainer.style.display='none'
    }else{
        if(elements.toolsFrameContainer)elements.toolsFrameContainer.style.display='block';
        if(elements.toolsFrame){
            elements.toolsFrame.style.display='block';
            elements.toolsFrame.src=src
        }
        if(elements.gamesFrameContainer)elements.gamesFrameContainer.style.display='none'
    }
    if(elements.newsFrameContainer)elements.newsFrameContainer.style.display='none';
    if(elements.guestbookFrameContainer)elements.guestbookFrameContainer.style.display='none';
    if(elements.privateFolderFullscreen)elements.privateFolderFullscreen.style.display='none';
    privateFolderOpen=false
}
function openGuestBook(){
    console.log("openGuestBook called");
    const visited=localStorage.getItem("guestbookVisited");
    if(elements.guestbookFrame){
        elements.guestbookFrame.src=visited?"https://lostbox1000.neocities.org/blocked.html":"https://lostbox1000.neocities.org/blocked.html";
        if(!visited)guestbookTimer=setTimeout(()=>localStorage.setItem("guestbookVisited","true"),5000)
    }
    if(elements.guestbookFrameContainer)elements.guestbookFrameContainer.style.display='block';
    if(elements.guestbookFrame)elements.guestbookFrame.style.display='block';
    if(elements.contentBox)elements.contentBox.style.display='none';
    if(elements.mainMenu)elements.mainMenu.style.display='none';
    if(elements.backBtn)elements.backBtn.style.display='block';
    if(elements.newsBtn)elements.newsBtn.style.display='none';
    guestbookOpen=true;
    if(elements.pageTitle)elements.pageTitle.textContent="LostBox GB";
    if(elements.mainToolbar)elements.mainToolbar.style.display='flex';
    if(elements.mainBottomBar)elements.mainBottomBar.style.display='flex';
    if(elements.privateFolderFullscreen)elements.privateFolderFullscreen.style.display='none';
    privateFolderOpen=false
}
function returnToMain(){
    console.log("returnToMain called");
    if(elements.toolsFrameContainer)elements.toolsFrameContainer.style.display='none';
    if(elements.gamesFrameContainer)elements.gamesFrameContainer.style.display='none';
    if(elements.newsFrameContainer)elements.newsFrameContainer.style.display='none';
    if(elements.guestbookFrameContainer)elements.guestbookFrameContainer.style.display='none';
    if(elements.toolsFrame){
        elements.toolsFrame.style.display='none';
        elements.toolsFrame.src=''
    }
    if(elements.gamesFrame){
        elements.gamesFrame.style.display='none';
        elements.gamesFrame.src=''
    }
    if(elements.newsFrame){
        elements.newsFrame.style.display='none';
        elements.newsFrame.src=''
    }
    if(elements.guestbookFrame){
        elements.guestbookFrame.style.display='none';
        elements.guestbookFrame.src=''
    }
    if(guestbookTimer){
        clearTimeout(guestbookTimer);
        guestbookTimer=null
    }
    guestbookOpen=false;
    if(elements.mainToolbar)elements.mainToolbar.style.display='flex';
    if(elements.mainBottomBar)elements.mainBottomBar.style.display='flex';
    if(elements.pageTitle)elements.pageTitle.textContent="LostBox";
    if(elements.backBtn)elements.backBtn.style.display='none';
    if(elements.newsBtn)elements.newsBtn.style.display='block';
    if(elements.contentBox)elements.contentBox.style.display='flex';
    if(elements.mainMenu)elements.mainMenu.style.display='flex';
    if(wasMusicPlaying)toggleMusic(true);
    if(newsOpen)closeNews();
    if(elements.privateFolderFullscreen)elements.privateFolderFullscreen.style.display='none';
    privateFolderOpen=false;
    isPanelMode=false;
    if(policyIframe){
        policyIframe.remove();
        policyIframe=null;
        if(elements.mainMenu)elements.mainMenu.style.display='flex';
        if(elements.profilePage)elements.profilePage.style.display='none'
    }
}
function toggleMusic(state){
    console.log("toggleMusic:",state);
    musicPlaying=state;
    if(musicPlaying&&elements.bgMusic){
        elements.bgMusic.play().catch((e)=>{
            console.log("Autoplay blocked:",e);
            musicPlaying=false;
            updateMusicIcon();
            alert("Нажмите кнопку музыки снова после взаимодействия с сайтом")
        });
        if(musicPlaying){
            if(elements.musicBtn)elements.musicBtn.title="Отключить музыку";
            if(!iconInterval){
                iconInterval=setInterval(()=>{
                    currentFrame=currentFrame===1?2:1;
                    if(elements.musicIcon)elements.musicIcon.src=`assets/photo_resources/onmusic${currentFrame}.png`
                },1000)
            }
        }
    }else{
        if(elements.bgMusic)elements.bgMusic.pause();
        if(elements.musicBtn)elements.musicBtn.title="Включить музыку";
        if(iconInterval){
            clearInterval(iconInterval);
            iconInterval=null
        }
        if(elements.musicIcon)elements.musicIcon.src="assets/photo_resources/offmusic.png"
    }
}
function updateMusicIcon(){
    if(musicPlaying&&elements.musicIcon){
        elements.musicIcon.src=`assets/photo_resources/onmusic${currentFrame}.png`;
        if(elements.musicBtn)elements.musicBtn.title="Отключить музыку"
    }else if(elements.musicIcon){
        elements.musicIcon.src="assets/photo_resources/offmusic.png";
        if(elements.musicBtn)elements.musicBtn.title="Включить музыку"
    }
}
function openNews(){
    console.log("openNews called");
    if(elements.newsIcon)elements.newsIcon.innerHTML='<img src="assets/photo_resources/back.png" alt="Назад">';
    newsOpen=true;
    if(elements.newsFrameContainer)elements.newsFrameContainer.style.display='block';
    if(elements.newsFrame){
        elements.newsFrame.style.display='block';
        elements.newsFrame.src='news.html'
    }
    if(elements.contentBox)elements.contentBox.style.display='none';
    if(elements.mainToolbar)elements.mainToolbar.style.display='flex';
    if(elements.mainBottomBar)elements.mainBottomBar.style.display='flex';
    if(elements.privateFolderFullscreen)elements.privateFolderFullscreen.style.display='none';
    privateFolderOpen=false
}
function closeNews(){
    console.log("closeNews called");
    if(elements.newsIcon)elements.newsIcon.textContent='📢';
    newsOpen=false;
    if(elements.newsFrameContainer)elements.newsFrameContainer.style.display='none';
    if(elements.newsFrame){
        elements.newsFrame.style.display='none';
        elements.newsFrame.src=''
    }
    if(elements.contentBox)elements.contentBox.style.display='flex';
    if(elements.mainMenu)elements.mainMenu.style.display='flex'
}
function openPrivateFolder(){
    console.log("openPrivateFolder called");
    if(elements.privateFolderFullscreen){
        elements.privateFolderFullscreen.style.display='block';
        if(elements.privateFolderFrame){
            elements.privateFolderFrame.style.display='block'
        }
    }
    if(elements.profilePage)elements.profilePage.style.display='none';
    if(elements.mainMenu)elements.mainMenu.style.display='none';
    if(elements.contentBox)elements.contentBox.style.display='none';
    if(elements.backBtn)elements.backBtn.style.display='block';
    if(elements.newsBtn)elements.newsBtn.style.display='none';
    if(elements.pageTitle)elements.pageTitle.textContent="Личная папка";
    privateFolderOpen=true;
    if(elements.mainToolbar)elements.mainToolbar.style.background='linear-gradient(to right, #000, #000, #000)';
    if(elements.mainBottomBar)elements.mainBottomBar.style.background='linear-gradient(to right, #000, #000, #000)'
}
function closePrivateFolder(){
    console.log("closePrivateFolder called");
    if(elements.privateFolderFullscreen)elements.privateFolderFullscreen.style.display='none';
    privateFolderOpen=false;
    cameFromPrivateFolder=true;
    if(elements.mainToolbar)elements.mainToolbar.style.background='linear-gradient(to right, #1168c2, #0d5aa6, #1168c2)';
    if(elements.mainBottomBar)elements.mainBottomBar.style.background='linear-gradient(to right, #1168c2, #0d5aa6, #1168c2)';
    showProfile()
}
function validateDOMElements(){
    console.log("Validating DOM elements...");
    const requiredElements=['mainMenu','profilePage','contentBox','mainUsername','profileUsername','usernameInput'];
    requiredElements.forEach(elementId=>{
        if(!elements[elementId]){
            console.error(`Required element not found: ${elementId}`)
        }else{
            console.log(`Element found: ${elementId}`)
        }
    })
}
function openTutorialDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(TUTORIAL_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(TUTORIAL_STORE_NAME)) {
                db.createObjectStore(TUTORIAL_STORE_NAME);
            }
        };
    });
}
function getFromTutorialDB(key) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openTutorialDB();
            const transaction = db.transaction([TUTORIAL_STORE_NAME], 'readonly');
            const store = transaction.objectStore(TUTORIAL_STORE_NAME);
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || 0);
        } catch (error) {
            reject(error);
        }
    });
}
function saveToTutorialDB(key, value) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openTutorialDB();
            const transaction = db.transaction([TUTORIAL_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(TUTORIAL_STORE_NAME);
            const request = store.put(value, key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        } catch (error) {
            reject(error);
        }
    });
}
function showPolicyTutorialHint() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    const message = document.createElement('div');
    message.className = 'tutorial-message';
    message.textContent = 'Тут можно ознакомиться с политикой LostBox (нажмите на логотип, и снова нажмите, чтобы выйти оттуда)';
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    const hideMessage = () => {
        document.body.removeChild(overlay);
        getFromTutorialDB(POLICY_TUTORIAL_KEY).then(count => {
            saveToTutorialDB(POLICY_TUTORIAL_KEY, count + 1);
        });
    };
    overlay.addEventListener('click', hideMessage);
    setTimeout(hideMessage, 10000);
}
async function checkAndShowPolicyTutorial() {
    try {
        const viewCount = await getFromTutorialDB(POLICY_TUTORIAL_KEY);
        if (viewCount < 5) {
            setTimeout(showPolicyTutorialHint);
        }
    } catch (error) {
        console.error('Ошибка при работе с IndexedDB для обучающего сообщения:', error);
        setTimeout(showPolicyTutorialHint);
    }
}
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds(); 
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    const timeString = hours + ':' + minutes + ':' + seconds;
    document.getElementById('clock').textContent = timeString;
}
// Функция для получения ключа на основе даты
function getDailyKey() {
    const today = new Date();
    return `fact_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
}

// Функция для загрузки и показа факта дня
async function loadDailyFact() {
    try {
        const dailyKey = getDailyKey();
        
        // Проверяем, есть ли уже факт для сегодняшнего дня
        const savedFact = localStorage.getItem(dailyKey);
        
        if (savedFact) {
            // Используем сохраненный факт
            displayFact(savedFact);
        } else {
            // Загружаем новый факт и сохраняем на день
            const response = await fetch('facts.json');
            const data = await response.json();
            
            // Выбираем случайный факт
            const randomIndex = Math.floor(Math.random() * data.facts.length);
            const randomFact = data.facts[randomIndex];
            
            // Сохраняем в localStorage на сегодня
            localStorage.setItem(dailyKey, randomFact);
            
            // Показываем факт
            displayFact(randomFact);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки фактов:', error);
        
        // Fallback на случай ошибки
        displayFact("Факт дня: LostBox всегда FoundBox! 😊");
    }
}

// Функция для отображения факта
function displayFact(fact) {
    const factsElement = document.getElementById('facts');
    if (factsElement) {
        factsElement.textContent = fact;
        
        // Добавляем анимацию появления
        factsElement.style.opacity = '0';
        factsElement.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            factsElement.style.opacity = '1';
        }, 100);
    }
}

// Функция для проверки смены дня
function checkDayChange() {
    const lastCheck = localStorage.getItem('lastDateCheck');
    const today = new Date().toDateString();
    
    if (lastCheck !== today) {
        // День сменился, обновляем факт
        localStorage.setItem('lastDateCheck', today);
        loadDailyFact();
    }
}

// Запускаем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadDailyFact();
    
    // Проверяем смену дня каждую минуту
    setInterval(checkDayChange, 520 * 1000);
});
function initApp(){
    console.log("initApp started");
    validateDOMElements();
    initWelcomeMessage();
    createConfirmModal();
    initDB();
    toggleMusic(false);
    if(elements.newsBtn) elements.newsBtn.style.display='block';
    if(elements.backBtn){
        elements.backBtn.addEventListener('click',()=>{
            if(privateFolderOpen){
                closePrivateFolder()
            }else{
                returnToMain()
            }
        });
    }else{
        console.error("Back button element not found")
    }
    updateClock(); 
    setInterval(updateClock, 1000); 
    if(elements.musicBtn){
        elements.musicBtn.addEventListener('click',()=>toggleMusic(!musicPlaying))
    }else{
        console.error("Music button element not found")
    }
    if(elements.newsBtn){
        elements.newsBtn.addEventListener('click',()=>newsOpen?closeNews():openNews())
    }else{
        console.error("News button element not found")
    }
    if(elements.profileBackBtn){
        elements.profileBackBtn.addEventListener('click',checkUnsavedChanges)
    }else{
        console.error("Profile back button element not found")
    }
    if(elements.changeAvatarBtn){
        elements.changeAvatarBtn.addEventListener('click',changeAvatar)
    }else{
        console.error("Change avatar button element not found")
    }
    if(elements.saveProfileBtn){
        elements.saveProfileBtn.addEventListener('click',saveProfile)
    }else{
        console.error("Save profile button element not found")
    }
    if(elements.repairBtn){
        elements.repairBtn.addEventListener('click',repairLostBox)
    }else{
        console.error("Repair button element not found")
    }
    if(elements.confirmSaveBtn){
        elements.confirmSaveBtn.addEventListener('click',saveAndHideProfile)
    }else{
        console.error("Confirm save button element not found")
    }
    if(elements.confirmCancelBtn){
        elements.confirmCancelBtn.addEventListener('click',hideProfile)
    }else{
        console.error("Confirm cancel button element not found")
    }
    if(elements.usernameInput){
        elements.usernameInput.addEventListener('input',()=>hasUnsavedChanges=true)
    }else{
        console.error("Username input element not found")
    }
    if(elements.profilePrivateBtn){
        elements.profilePrivateBtn.addEventListener('click',openPrivateFolder)
    }else{
        console.error("Profile private button element not found")
    }
    const logoImg = document.getElementById('lostboxpolicy');
    if(logoImg){
        console.log('Logo img found, adding listeners');
        const handleLogoClick = function(e){
            console.log('Logo click triggered! Event:', e.type);
            e.preventDefault();
            e.stopPropagation();
            if(isPanelMode){
                console.log('Exiting panel mode');
                returnToMain();
                isPanelMode = false;
            } else {
                console.log('Entering panel mode');
                if(elements.newsBtn) elements.newsBtn.style.display = 'none';
                if(elements.mainMenu) elements.mainMenu.style.display = 'none';
                if(elements.profilePage) elements.profilePage.style.display = 'none';
                if(policyIframe){
                    policyIframe.remove();
                    console.log('Removed old iframe');
                }
                policyIframe = document.createElement('iframe');
                policyIframe.src = 'lostboxpolicy.html';
                policyIframe.style.width = '100%';
                policyIframe.style.height = '100%';
                policyIframe.style.border = 'none';
                policyIframe.style.display = 'block';
                policyIframe.style.position = 'absolute';
                policyIframe.style.top = '0';
                policyIframe.style.left = '0';
                policyIframe.style.zIndex = '10';
                elements.contentBox.appendChild(policyIframe);
                console.log('Iframe added to contentBox');
                isPanelMode = true;
            }
        };  
        logoImg.addEventListener('click', handleLogoClick);
        logoImg.style.cursor = 'pointer'; 
        checkAndShowPolicyTutorial();
    } else {
        console.error('Logo img not found!');
    }
    const rippleButtons = document.querySelectorAll('.menu-buttons .ripple-button');
    console.log("Found ripple buttons:", rippleButtons.length);
    rippleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if(btn.dataset.profile === 'true'){
                console.log("Profile button clicked");
                cameFromPrivateFolder = false;
                showProfile();
            } else if(btn.dataset.src){
                console.log("Ripple button clicked:", btn.dataset.src);
                loadTool(btn.dataset.src, btn.dataset.title, btn.dataset.hide === 'true', btn.dataset.game === 'true');
            }
        });
    });
    window.addEventListener('message', (e) => {
        if(e.data === 'closeFrame') returnToMain();
    });
    console.log("App initialization completed");
}
document.addEventListener('DOMContentLoaded',initApp);