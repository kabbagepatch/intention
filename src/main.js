const { invoke } = window.__TAURI__.core;
const { defaultWindowIcon } = window.__TAURI__.app;

/* Window Repositioning to Corner */
const tauriWindow = window.__TAURI__.window;
const currentWindow = tauriWindow.getCurrentWindow();
async function reposition() {
  const monitors = await tauriWindow.availableMonitors();
  let monitor = monitors[0];
  const currentMonitor = await tauriWindow.currentMonitor();
  if (!monitor) monitor = currentMonitor;
  if (monitor) {
    const workAreaPosition = monitor.workArea.position;
    const workAreaSize = monitor.workArea.size;
    const windowSize = await currentWindow.outerSize();
    const x = workAreaPosition.x + workAreaSize.width - Math.floor(windowSize.width * monitor.scaleFactor / currentMonitor.scaleFactor);
    const y = workAreaPosition.y + workAreaSize.height - Math.floor(windowSize.height * monitor.scaleFactor / currentMonitor.scaleFactor);
    await currentWindow.setPosition(new tauriWindow.PhysicalPosition(x, y));
  }
}

/* Notification Request */
const tauriNotification = window.__TAURI__.notification;
let notifPermissionGranted = false;
async function requestNotifications() {
  notifPermissionGranted = await tauriNotification.isPermissionGranted();
  if (!notifPermissionGranted) {
    const permission = await tauriNotification.requestPermission();
    notifPermissionGranted = permission === 'granted';
  }
}

/* Tauri Store Load */
const { load } = window.__TAURI__.store;
const tauriStore = await load('store.json', { autoSave: false });
const storeMap = JSON.parse(localStorage.getItem("tauri_store_map") || "{}");
const populateStoreMap = async () => {
  const storeEntries = (await tauriStore.entries());
  storeEntries.forEach(entry => { storeMap[entry[0]] = entry[1] });
  ['widget', 'audio', 'notif', 'autostart'].forEach(s => {
    if (!storeMap[`${s}_setting`]) {
      storeMap[`${s}_setting`] = 'enable';
      tauriStore.set(`${s}_setting`, 'enable');
    }
  });
  if (!storeMap.multitask_setting) {
    storeMap.multitask_setting = 'disable';
    tauriStore.set('multitask_setting', 'disable');
  }
  if (!storeMap.snooze_duration) {
    storeMap.snooze_duration = 5;
    tauriStore.set('snooze_duration', 5);
  }
  if (!storeMap.intents) storeMap.intents = [];
  if (!storeMap.intentIndex) storeMap.intentIndex = 0;
  tauriStore.save();
}
let currentIntentInd = 0;

/* App Autostart settings */
const tauriAutostart = window.__TAURI__.autostart;
async function setAutostart(enable) {
  if (enable && !await tauriAutostart.isEnabled()) {
    await tauriAutostart.enable();
  }
  if (!enable && await tauriAutostart.isEnabled()) {
    await tauriAutostart.disable();
  }
}

/* Theme Setup */
const themes = {
  'morning': {
    'color-background-1': 'hsl(193, 69%, 88%)',
    'color-background-2': 'hsl(27, 71%, 73%)',
    'color-background-3': 'hsl(48, 100%, 87%)',
    'color-text': 'hsl(0, 0%, 9%)',
    'color-shadow': 'hsl(48, 100%, 87%)',
    'color-icon-button': 'hsl(0, 0%, 9%)',
    'color-button': 'hsl(48, 100%, 87%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
  'afternoon': {
    'color-background-1': 'hsl(193, 69%, 88%)',
    'color-background-2': 'hsl(193, 65%, 78%)',
    'color-background-3': 'hsl(198, 83%, 38%)',
    'color-text': 'hsl(0, 0%, 96%)',
    'color-icon-button': 'hsl(198, 83%, 38%)',
    'color-button': 'hsl(193, 69%, 88%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
  'evening': {
    'color-background-1': 'hsl(27, 71%, 73%)',
    'color-background-2': 'hsl(339, 60%, 46%)',
    'color-background-3': 'hsl(246, 100%, 18%)',
    'color-text': 'hsl(0, 0%, 96%)',
    'color-icon-button': 'hsl(0, 0%, 96%)',
    'color-button': 'hsl(246, 100%, 18%)',
    'color-button-text': 'hsl(0, 0%, 96%)',
  },
  'night': {
    'color-background-1': 'hsl(246, 100%, 2%)',
    'color-background-2': 'hsl(246, 100%, 10%)',
    'color-background-3': 'hsl(246, 100%, 18%)',
    'color-text': 'hsl(42, 24%, 89%)',
    'color-icon-button': 'hsl(42, 24%, 89%)',
    'color-button': 'hsl(42, 24%, 89%)',
    'color-button-text': 'hsl(0, 0%, 1%)',
  },
}

const stars = document.getElementById('stars');
function createStars() {
	for (let i = 0; i < 50; i++) {
		let x = Math.floor(Math.random() * 96 + 2);
		let y = Math.floor(Math.random() * 80 + 1);
		const starPoint = document.createElement('div');
		starPoint.style.left = `${x}%`;
		starPoint.style.top = `${y}%`;
		stars.appendChild(starPoint);
	}
}

let curTheme = '';
const setTheme = () => {
  let theme = 'afternoon';
  const currentHour = new Date().getHours();
  if (currentHour < 5) theme = 'night';
  else if (currentHour < 12) theme = 'morning';
  else if (currentHour < 18) theme = 'afternoon';
  else if (currentHour < 21) theme = 'evening';
  else theme = 'night';

  if (!Object.keys(themes).includes(theme)) return;
  if (curTheme === theme) return;

  curTheme = theme;
  const vars = themes[theme];
  const root = document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value);
    }
  });

  if (theme === 'night' && stars) {
    createStars();
  }

  const settingsSvg = document.getElementById('settings-icon');
  const backSvg = document.getElementById('back-icon');
  const snoozeSvg = document.getElementById('snooze-icon');
  const nextSvg = document.getElementById('next-icon');
  const aboutSvg = document.getElementById('about-icon');
  Array.from([settingsSvg, backSvg, aboutSvg]).forEach((icon) => {
    if (icon) {
      icon.style.fill = vars['color-icon-button'];
    }
  })
  Array.from([snoozeSvg, nextSvg]).forEach((icon) => {
    if (icon) {
      icon.style.fill = vars['color-text'];
    }
  })

  const title = document.getElementById('greeting')
  if (title) {
    if (theme === 'night') {
      theme = 'evening';
    }
    title.textContent = `Good ${theme[0].toUpperCase()}${theme.slice(1).toLowerCase()}!`;
  }
}

setTheme();
await populateStoreMap();
if (!sessionStorage.getItem("app_loaded")) {
  reposition();
  sessionStorage.setItem("app_loaded", "true");
}
if (!localStorage.getItem("app_loaded")) {
  requestNotifications();
  setAutostart(storeMap.autostart_setting === 'enable');
  localStorage.setItem("app_loaded", "true");
}

/* Form Preset */
const setPresets = async(isWidget = false) => {
  const intention = storeMap.intention;
  const endTime = storeMap.endtime;
  const remainingTime = endTime - Date.now();
  
  const h = Math.max(Math.floor(remainingTime / 3600000), 0);
  const m = Math.max(Math.floor((remainingTime % 3600000) / 60000), 0);
  const s = Math.max(Math.floor((remainingTime % 60000) / 1000), 0);
  if (isWidget) {
    document.getElementById('widget-title').textContent = intention;
    if (h === 0 && m === 0) {
      document.getElementById('timer-hours').textContent = String(m).padStart(2, '0');
      document.getElementById('timer-minutes').textContent = String(s).padStart(2, '0');
    } else {
      document.getElementById('timer-hours').textContent = String(h).padStart(2, '0');
      document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
    }
  } else if (storeMap.multitask_setting === 'disable') {
    if (remainingTime > 0) {
      if (intention) document.getElementById('intention-input').value = intention;
      document.getElementById('hours-input').value = h;
      document.getElementById('minutes-input').value = m;
    }
  }
}

const switchMode = async (mode='FORM', x=400, y=500) => {
  if (mode === 'FORM') {
    currentWindow.setDecorations(true);
    currentWindow.setSize(new tauriWindow.LogicalSize(x, y));
    await currentWindow.setShadow(true);
  } else {
    currentWindow.setDecorations(false);
    currentWindow.setSize(new tauriWindow.LogicalSize(x, y));
    await currentWindow.setShadow(false);
  }

  await reposition();
}

const removeIntentRow = (i) => {
  document.getElementById(`intent-${i}`).remove();
  const mapIndex = storeMap.intents.findIndex(intent => intent.index === i);
  storeMap.intents.splice(mapIndex, 1);
  tauriStore.set('intents', storeMap.intents);
  tauriStore.save();

  if (storeMap.intents.length === 0) {
    document.getElementById('start-button').disabled = true;
  }
}

const addIntent = (data) => {
  const index = storeMap.intentIndex;
  storeMap.intents.push({ index, ...data });
  storeMap.intentIndex += 1;
  tauriStore.set('intents', storeMap.intents);
  tauriStore.set('intentIndex', storeMap.intentIndex);
  tauriStore.save();

  addIntentRow(data);
}

const addIntentRow = (data) => {
  document.getElementById('start-button').disabled = false;
  const { index, intention, hours, minutes } = data;

  const intentsContainer = document.getElementById('intents-container');
  const containerDiv = document.createElement('div');
  containerDiv.id = `intent-${index}`;
  containerDiv.className = 'intent-row';
  const intentDiv = document.createElement('div');
  intentDiv.textContent = intention;
  const timeDiv = document.createElement('div');
  timeDiv.textContent = `${hours || 0}h ${minutes || 0}m`;
  timeDiv.className = 'intent-row-time'
  containerDiv.appendChild(intentDiv);
  containerDiv.appendChild(timeDiv);
  containerDiv.onclick = () => {
    removeIntentRow(index)
  }
  
  intentsContainer.appendChild(containerDiv);
}

const startSession = async (data) => {
  const { intention, hours, minutes } = data;
  tauriStore.set('intention', intention);
  const timeAdded = ((hours * 3600 + minutes * 60) * 1000);
  tauriStore.set('endtime', Date.now() + timeAdded);
  tauriStore.save();

  await switchMode('WIDGET', 300, 70);
  window.location.replace('widget.html');

  if (storeMap.widget_setting !== 'enable') {
    await currentWindow.hide()
  }
}

const form = document.getElementById('form');
if (form) {
  let vars;
  if (storeMap.multitask_setting === 'enable') {
    storeMap.intents.forEach(addIntentRow);
    vars = {
      'container-padding-top': '2vh',
      'container-h1-margin-bottom': '16px',
      'form-gap': '0px',
      'multitask-container-display': 'block',
      'submit-button-padding': '0.4em 0.6em'
    }
    document.getElementById('submit-button').textContent = 'Add';
    document.getElementById('start-button').addEventListener('click', () => {
      currentIntentInd = 0;
      startSession(storeMap.intents[currentIntentInd]);
    });
    if (!storeMap.intents.length) {
      document.getElementById('start-button').disabled = true;
    }
  } else {
    vars = {
      'container-padding-top': '10vh',
      'container-h1-margin-bottom': '36px',
      'form-gap': '10px',
      'multitask-container-display': 'none',
      'submit-button-padding': '0.6em 0.8em'
    }
    document.getElementById('submit-button').textContent = 'Start';
  }

  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    if (value) {
      root.style.setProperty(`--${key}`, value);
    }
  });

  await setPresets();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const formProps = Object.fromEntries(formData);
    if (storeMap.multitask_setting === 'enable') {
      addIntent(formProps);
    } else {
      startSession(formProps);
    }
    form.reset();
  });
}

const switchToForm = async (e) => {
  if (e) e.stopPropagation();
  if (window.location.pathname.includes('widget')) {
    await switchMode('FORM');
  }
  window.location.replace('index.html');
}

const startTimer = async (endTime) => {
  const audioEnabled = storeMap.audio_setting === 'enable';
  const notifEnabled = storeMap.notif_setting === 'enable';
  const widgetEnabled = storeMap.widget_setting === 'enable';
  const progressCircle = document.getElementById('progress-circle');
  const radius = progressCircle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = circumference;
  progressCircle.style.strokeDashoffset = 0;

  const totalRemainingTime = endTime - Date.now();
  let timeLeft = totalRemainingTime;
  if (timeLeft <= 0) return;

  const interval = setInterval(async () => {
    timeLeft = endTime - Date.now();
    let h = Math.max(Math.floor(timeLeft / 3600000), 0);
    let m = Math.max(Math.floor((timeLeft % 3600000) / 60000), 0);
    let s = Math.max(Math.floor((timeLeft % 60000) / 1000), 0);
    const timeFraction = timeLeft / totalRemainingTime;
    const offset = circumference * (1 - timeFraction);
    progressCircle.style.strokeDashoffset = offset;
    if (h === 0 && m === 0) {
      document.getElementById('timer-hours').textContent = String(m).padStart(2, '0');
      document.getElementById('timer-minutes').textContent = String(s).padStart(2, '0');
    } else {
      document.getElementById('timer-hours').textContent = String(h).padStart(2, '0');
      document.getElementById('timer-minutes').textContent = String(m).padStart(2, '0');
    }
    if (h === 0 && m === 0 && s === 0) {
      clearInterval(interval);
      if (audioEnabled) await new Audio('./assets/chime.mp3').play();
      if (notifEnabled) tauriNotification.sendNotification({
        title: 'Intention',
        body: 'Time\'s up! Nicely done. Take a break, look for things you might\'ve been ignoring. Snooze if more time needed'
      })
      if (!widgetEnabled) await currentWindow.show()
      progressCircle.style.strokeDashoffset = circumference;
      if (storeMap.multitask_setting === 'enable') {
        document.getElementById('next-button').style.display = 'block';
      } else {
        document.getElementById('snooze-button').style.display = 'block';
      }
      document.getElementById('timer-text').style.display = 'none';
    }
  }, 1000);
}

const snooze = (e) => {
  e.stopPropagation();
  const snoozeTime = storeMap.snooze_duration;
  document.getElementById('snooze-button').style.display = 'none';
  document.getElementById('timer-text').style.display = 'block';
  document.getElementById('timer-hours').textContent = String(0).padStart(2, '0');
  document.getElementById('timer-minutes').textContent = String(snoozeTime).padStart(2, '0');
  startTimer(Date.now() + (snoozeTime * 60 * 1000));
  if (storeMap.widget_setting !== 'enable') {
    currentWindow.hide()
  }
}

const next = async (e) => {
  e.stopPropagation();
  currentIntentInd += 1;
  if (storeMap.intents.length <= currentIntentInd) {
    await switchToForm();
    return;
  }
  const currentIntent = storeMap.intents[currentIntentInd];
  document.getElementById('next-button').style.display = 'none';
  document.getElementById('timer-text').style.display = 'block';
  document.getElementById('widget-title').textContent = String(currentIntent.intention).padStart(2, '0');
  document.getElementById('timer-hours').textContent = String(currentIntent.hours).padStart(2, '0');
  document.getElementById('timer-minutes').textContent = String(currentIntent.minutes).padStart(2, '0');
  startTimer(Date.now() + ((currentIntent.hours * 3600 + currentIntent.minutes * 60) * 1000));
  if (storeMap.widget_setting !== 'enable') {
    currentWindow.hide()
  }
}

const widgetContainer = document.getElementById('widget-container');
if (widgetContainer) {
  // let decorationsEnabled = false;
  // widgetContainer.addEventListener('click', async (e) => {
  //   decorationsEnabled = !decorationsEnabled;
  //   currentWindow.setSize(new tauriWindow.LogicalSize(300, decorationsEnabled ? 120 : 70));
  //   currentWindow.setDecorations(decorationsEnabled);
  // })
  setPresets(true);
  document.getElementById('snooze-button').addEventListener('click', snooze);
  document.getElementById('next-button').addEventListener('click', next);

  const endTime = await tauriStore.get('endtime');
  startTimer(endTime);
}

const backButton = document.getElementById('back-button');
if (backButton) {
  backButton.addEventListener('click', switchToForm);
}

const aboutButton = document.getElementById('about-button');
if (aboutButton) {
  aboutButton.addEventListener('click', () => {
    window.location.replace('about.html');
  });
}

const settingsButton = document.getElementById('settings-button');
if (settingsButton) {
  settingsButton.addEventListener('click', () => {
    window.location.replace('settings.html');
  });
}

const setInitialSettings = async () => {
  document.getElementById('widget_enable').checked = true;
  document.getElementById('autostart_disable').checked = true;
  document.getElementById('audio_disable').checked = true;

  Object.keys(storeMap).forEach(key => {
    const value = storeMap[key];

    if (!key.includes('setting')) return;
    key = key.split('_')[0];
    document.getElementById(`${key}_enable`).checked = value === 'enable';
    document.getElementById(`${key}_disable`).checked = value !== 'enable';
  })
}

const settings = document.getElementById('settings');
if (settings) {
  setInitialSettings();

  const radioButtons = document.querySelectorAll('input[type="radio"]');
  radioButtons.forEach(radio => {
    radio.addEventListener('change', async (event) => {
      const settingKey = `${event.target.name}_setting`;
      const settingValue = event.target.value;
      tauriStore.set(settingKey, settingValue);
      if (settingKey === 'multitask_setting' && settingValue === 'disable') {
        tauriStore.set('intents', []);
        tauriStore.set('intentIndex', 0);
      }
      tauriStore.save();

      if (event.target.name === 'autostart') setAutostart(settingValue === 'enable');
    });
  });

  const snoozeInput = document.getElementById('snooze-time');
  snoozeInput.value = storeMap.snooze_duration;
  snoozeInput.addEventListener('input', async (event) => {
    const snoozeValue = parseInt(event.target.value, 10);
    storeMap.snooze_duration = snoozeValue;
    tauriStore.set('snooze_duration', snoozeValue);
    tauriStore.save();
  })
}
