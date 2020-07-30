// (function() {
  // getTodaySchedules()

const PRIVATE_EVENTS_ID        = '***@gmail.com';                 // Private Account
const PRIVATEWORKS_ID          = '***@group.calendar.google.com';
const TRAININGS_ID             = '***@group.calendar.google.com';
const CHORES_ID                = '***@group.calendar.google.com';  // 雑務
const ARCHITECT_AND_DEVELOP_ID = '***@group.calendar.google.com';  // 設計／開発
const RESEARCH_AND_VERIFY_ID   = '***@group.calendar.google.com';  // 調査／検証
const PRIVATE_THINGS_TODO_ID   = '***@group.calendar.google.com';  // 用事／移動@Private
const EVENTS_BY_CONNPASS_ID    = '***@import.calendar.google.com';
const DAC_EVENTS_ID            = '***@dac.co.jp';                  // DAC Account
const DAC_THINGS_TODO_ID       = '***@group.calendar.google.com';  // Mtg／移動@dac
const ZERO_DAC_EVENTS_ID       = '***@group.calendar.google.com';  // 第零@dac

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

var today = {
  // TODO: update read-only
  day: new Date(),
  getDay: function() {
    return this.day
  }
};

  function getTodaySchedules() {
    try {
      let calendars = getCalendars(calendarsId);
      let events    = getEventsExceptAllDay(calendars)

      writeSpreadSheet(events);
    } catch (error) {
      Logger.log(error);
    }
  }

  function getCalendars(calendarsId) {
    var calendars = [];

    calendarsId.map(function(id) {
      calendars.push(CalendarApp.getCalendarById(id));
    });

    return calendars;
  }

  function getEventsExceptAllDay(calendars) {
    var events = [];

    calendars.map(function(cal) {
      let _today      = today.getDay();
      let todayEvents = cal.getEventsForDay(_today);

      todayEvents.map(function(event) {
        var bool = exceptAllDayEvents(event);

        if (bool) events.push(event);
      });
    });

    return events;
  }

  function exceptAllDayEvents(event) {
    let startTime     = event.getStartTime().toTimeString().slice(0, 8);
    let endTime       = event.getEndTime().toTimeString().slice(0, 8);
    let isNotAllEvent = (startTime != '00:00:00' && endTime != '00:00:00') ? true : false;

    return isNotAllEvent;
  }

  function writeSpreadSheet(events) {
    let file   = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = insertSheetForToday(file);

    if (sheet) {
      writeEventInfoToSheet(sheet, events);
    }
  };

  function insertSheetForToday(file) {
    let sheets = file.getSheets();
    let _today = today.getDay();
    let dayStr = _today.getDate().toString();

    if (!file.getSheetByName(dayStr)) {
      return file.insertSheet(dayStr, file.getNumSheets());
    }
  }

  function writeEventInfoToSheet(sheet, events) {
    events.map(function(event, i) {
      var calendar  = CalendarApp.getCalendarById(event.getOriginalCalendarId());
      var calName   = calendar != null ? calendar.getName() : 'event@DAC';
      var eventName = event.getTitle() != '' ? event.getTitle() : '予定あり';
      var startTime = event.getStartTime().toTimeString().slice(0, 8);
      var endTime   = event.getEndTime().toTimeString().slice(0, 8);
      var totalTime = getActivityTime(event, events);

      sheet.getRange(i + 1, 1).setValue(calName);
      sheet.getRange(i + 1, 2).setValue(eventName);
      sheet.getRange(i + 1, 3).setValue(startTime);
      sheet.getRange(i + 1, 4).setValue(endTime);
      sheet.getRange(i + 1, 5).setValue(totalTime);
    });
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