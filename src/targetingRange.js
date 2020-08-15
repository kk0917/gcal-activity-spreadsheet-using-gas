function getSchedulesTargetRange() {
  let from = new Date(YYYY, (M - 1), 1); // M = key begin from 0
  let to   = new Date(YYYY, (M - 1), 1);
  
  for(var d = from; d < to; d.setDate(d.getDate()+1)) { // end with yesterday of to Date value
    let YEAR_STR  = d.getFullYear().toString();
    let MONTH_STR = d.getMonth().toString().length == 2 ? (d.getMonth() + 1).toString() : '0' + (d.getMonth() + 1).toString();
    let DATE_STR  = d.getDate().toString().length == 2 ? d.getDate().toString() : '0' + d.getDate().toString();

    let SSHEET_NAME = 'gcal-daily-activity-spreadsheet-' + YEAR_STR + MONTH_STR;

    getTodaySchedules();

    function getTodaySchedules() {
      try {
        let folder    = getTargetFolder();
        let file       = getTargetFile(folder);
        let calendars = getCalendars(calendarsId);
        let events    = getEvents(calendars);
        
        writeSpreadSheet(SpreadsheetApp.open(file), events); //convert FileApp class to SpreadsheetApp class operating target Spreadsheet.
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
        let _today      = d;
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
    
    function writeSpreadSheet(sSheet, events) {
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
      sheet.getRange(1, 1).setValue('CalendarName');
      sheet.getRange(1, 2).setValue('eventName');
      sheet.getRange(1, 3).setValue('startTime');
      sheet.getRange(1, 4).setValue('endTime');
      sheet.getRange(1, 5).setValue('totalTime');
      
      events.map(function(event, i) {
        var calendar  = CalendarApp.getCalendarById(event.getOriginalCalendarId());
        var calName   = calendar != null ? calendar.getName() : 'event@DAC';
        var eventName = event.getTitle() != '' ? event.getTitle() : '予定あり';
        var startTime = event.getStartTime().toTimeString().slice(0, 8);
        var endTime   = event.getEndTime().toTimeString().slice(0, 8);
        var totalTime = getActivityTime(event, events);
        
        sheet.getRange(2 + i, 1).setValue(calName);
        sheet.getRange(2 + i, 2).setValue(eventName);
        sheet.getRange(2 + i, 3).setValue(startTime);
        sheet.getRange(2 + i, 4).setValue(endTime);
        sheet.getRange(2 + i, 5).setValue(totalTime);
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
  }
}