// (function() {

const PRIVATE_EVENTS_ID        = '***@gmail.com';                 // Private Account
const PRIVATEWORKS_ID          = '***@group.calendar.google.com';
const TRAININGS_ID             = '***@group.calendar.google.com';
const CHORES_ID                = '***@group.calendar.google.com'; // 雑務
const CHORES_ID                = '***@group.calendar.google.com'; // 雑務
const ARCHITECT_AND_DEVELOP_ID = '***@group.calendar.google.com'; // 設計／開発
const RESEARCH_AND_VERIFY_ID   = '***@group.calendar.google.com'; // 調査／検証
const PRIVATE_THINGS_TODO_ID   = '***@group.calendar.google.com'; // 用事／移動@Private
const BAND_MUSIC_ID            = '***@group.calendar.google.com'; // 演奏／作曲
const EVENTS_BY_CONNPASS_ID    = '***@import.calendar.google.com';
const DAC_EVENTS_ID            = '***@dac.co.jp';                 // DAC Account
const DAC_THINGS_TODO_ID       = '***@group.calendar.google.com'; // Mtg／移動@dac
const ZERO_DAC_EVENTS_ID       = '***@group.calendar.google.com'; // 第零@dac

const calendarsId = [
  PRIVATE_EVENTS_ID,
  PRIVATEWORKS_ID,
  TRAININGS_ID,
  CHORES_ID,
  ARCHITECT_AND_DEVELOP_ID,
  RESEARCH_AND_VERIFY_ID,
  PRIVATE_THINGS_TODO_ID,
  EVENTS_BY_CONNPASS_ID,
  DAC_EVENTS_ID,
  DAC_THINGS_TODO_ID, 
  ZERO_DAC_EVENTS_ID
];

const today = {
  // TODO: update read-only
  day: new Date(), // Month number needs to minus 1 when you insert date string as arguments. Date.getMonth() starts 0.
  getDay: function() {
    return this.day
  }
};

const YEAR_STR  = today.getDay().getFullYear().toString();
const MONTH_STR = today.getDay().getMonth().toString().length == 2 ? (today.getDay().getMonth() + 1).toString() : '0' + (today.getDay().getMonth() + 1).toString();
const DATE_STR  = today.getDay().getDate().toString().length == 2 ? today.getDay().getDate().toString() : '0' + today.getDay().getDate().toString();

const READMINE_TICKET_ID = /\#[0-9]+/;
const JIRA_ZERO_TASK_ID  = /ZERO\-[0-9]+/;
const taskTypesId        = [
  READMINE_TICKET_ID,
  JIRA_ZERO_TASK_ID
];

const SSHEET_NAME      = 'gcal-daily-activity-spreadsheet-' + YEAR_STR + MONTH_STR;
const ROOT_FOLDER_ID   = '***';

function getTodaySchedules() {
  try {
    let folder    = getTargetFolder();
    let file       = getTargetFile(folder);
    let calendars = getCalendars(calendarsId);
    let events    = getEvents(calendars);

    writeSpreadSheet(SpreadsheetApp.open(file), events); //convert FileApp class to SpreadsheetApp class operating target Spreadsheet.
    // TODO: 週次、月次の集計を行う。「シート1」に出力
    // TODO: 週次、月次データをGDPに取り込み
  } catch (error) {
    Logger.log(error);
  }
}

function getTargetFolder() {
  let rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  let yearFolder = rootFolder.getFoldersByName(YEAR_STR);

  if (yearFolder.hasNext()) {
    return yearFolder.next();

  } else {
    let newFolder = DriveApp.createFolder(YEAR_STR);
    newFolder.moveTo(rootFolder);

    return newFolder;
  }
}

function getTargetFile(folder) {
  let file = folder.getFilesByName(SSHEET_NAME);
  if (file.hasNext()) {
    return file.next();

  } else {
    let sSheet = SpreadsheetApp.create(SSHEET_NAME);
    let file    = DriveApp.getFileById(sSheet.getId());

    file.moveTo(folder);

    return file;
  }
}

function getCalendars(calendarsId) {
  var calendars = [];

  calendarsId.map(function(id) {
    calendars.push(CalendarApp.getCalendarById(id));
  });

  return calendars;
}

function getEvents(calendars) {
  var events = [];

  calendars.map(function(cal) {
    let _today      = today.getDay();
    let todayEvents = cal.getEventsForDay(_today);

    // filtering out the non-target events.
    todayEvents.map(function(event) {
      var bool = exceptAllDayEvent(event);
      // TODO: add function to except duplicated events, and 0 time events.

      if (bool) events.push(event);
    });
  });

  return events;
}

function exceptAllDayEvent(event) {
  let startTime     = event.getStartTime().toTimeString().slice(0, 8);
  let endTime       = event.getEndTime().toTimeString().slice(0, 8);
  let isNotAllDayEvent = (startTime != '00:00:00' && endTime != '00:00:00') ? true : false;

  return isNotAllDayEvent;
}

function writeSpreadSheet(sSheet, events) { // TODO: add overwrite mode
  let sheet = insertSheetForToday(sSheet);

  if (sheet != null) {
    writeEventInfoToSheet(sheet, events);
  }
};

function insertSheetForToday(sSheet) {
  if (sSheet.getSheetByName(DATE_STR) == null) {
    return sSheet.insertSheet(DATE_STR, sSheet.getNumSheets());
  }
}

function writeEventInfoToSheet(sheet, events) {
  // Write header
  sheet.getRange(1, 1).setValue('calendarName');
  sheet.getRange(1, 2).setValue('eventName');
  sheet.getRange(1, 3).setValue('startTime');
  sheet.getRange(1, 4).setValue('endTime');
  sheet.getRange(1, 5).setValue('totalTime');
  sheet.getRange(1, 6).setValue('taskId');

  events.map(function(event, i) {
    var calendar  = CalendarApp.getCalendarById(event.getOriginalCalendarId());
    var calName   = calendar != null ? calendar.getName() : 'event@DAC';
    var eventName = event.getTitle() != '' ? event.getTitle() : '予定あり';
    var startTime = event.getStartTime().toTimeString().slice(0, 8);
    var endTime   = event.getEndTime().toTimeString().slice(0, 8);
    var totalTime = getActivityTime(event, events);
    var taskId    = extractTaskId(eventName);

    sheet.getRange(2 + i, 1).setValue(calName);
    sheet.getRange(2 + i, 2).setValue(eventName);
    sheet.getRange(2 + i, 3).setValue(startTime);
    sheet.getRange(2 + i, 4).setValue(endTime);
    sheet.getRange(2 + i, 5).setValue(totalTime);
    sheet.getRange(2 + i, 6).setValue(taskId);
  });

  function extractTaskId(eventName) {
    let taskId = '-';

    taskTypesId.map(id => {
      var result = eventName.match(id);

      if (result) {
        taskId = result;
        return;
      }
    });
  
    return taskId;
  }
}

function getActivityTime(event, events) {
  var hours        = event.getEndTime().getHours() - event.getStartTime().getHours();
  var minutes      = event.getEndTime().getMinutes() - event.getStartTime().getMinutes();
  [hours, minutes] = calcTotalTime(hours, minutes);

  events.map(function(_event) {
    if (event.getId() != _event.getId() && event.getStartTime() <= _event.getStartTime() && event.getEndTime() >= _event.getEndTime()) {
      var _hours         = _event.getEndTime().getHours() - _event.getStartTime().getHours();
      var _minutes       = _event.getEndTime().getMinutes() - _event.getStartTime().getMinutes();
      [_hours, _minutes] = calcTotalTime(_hours, _minutes);

      hours   -= _hours;
      minutes -= _minutes;

      [hours, minutes] = calcTotalTime(hours, minutes);
    }
  });

  return hours + ':' + minutes + ':00';

  function calcTotalTime(hours, minutes) {
    if (minutes < 0) {
      --hours;
      minutes = 60 + minutes;
    }

    return [hours, minutes];
  }
}

// TODO: make mv column function if there isn't the existing same like function
function moveColumnToRight() {
  
}
// })();