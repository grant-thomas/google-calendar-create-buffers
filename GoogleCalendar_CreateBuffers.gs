// Google Calendar (ICON Create Buffers)

function myFunction() {
  // THIS SCRIPT CREATES "BUFFER" EVENTS BEFORE AND AFTER NEWLY CREATED CALENDAR EVENTS


  // USER INPUT CALENDAR
  const calendar = "Grant Sessions"; // NAME OF CALENDAR BEING MODIFIED
  const calendarID = CalendarApp.getCalendarsByName(calendar)[0].getId(); // GET CALENDAR ID
  Logger.log("Modifying buffers for calendarID: " + calendarID);


  // USER INPUT BUFFER LENGTH (IN MINUTES)
  const bufferLength = 30;


  // USER INPUT BUFFER COLOR
  const bufferColor = 'RED';

  // SET DATE RANGE (DEFAULT IS 180 DAYS FROM THE CURRENT DAY)
  var startDate = new Date(); // START DATE OF THE RANGE TO BE MODIFIED
  var endDate   = new Date(); // END DATE OF THE RANGE TO BE MOFIFIED (90 DAYS FROM TODAY)
  endDate.setDate(startDate.getDate() + 90);
  Logger.log("Start date = " + startDate);
  Logger.log("End date   = " + endDate);
  

  var optionalArgs = {
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    showDeleted: false,
    singleEvents: true,
    orderBy: 'startTime'
  };
  

  // CREATE LIST OF CALENDAR ALL CALEDNAR EVENTS ON USER'S CALENDAR THAT BETWEEN THE SPECIFIED DATES
  var service = Calendar.Events;
  var response = Calendar.Events.list(calendarID, optionalArgs);
  var events = response.items;

  // SEARCH THROUGH EVENTS
  for (i = 0; i < events.length; i++) {    
    // LIST EACH EVENT
    //Logger.log(events[i].summary);

    // ============================================================================================================== //
    // IF THE EVENT IS A BUFFER
    //
    // TEST IF AN EVENT WAS DELETED, IF SO THEN DELETE THE BUFFER EVENTS CONNECTED TO IT
    // METHOD: IF EITHER THE PRE BUFFER OR POST BUFFER BECOMES DISCONNECTED FROM THE EVENT, THEN DELETE IT
    //
    if (events[i].summary == "-"){
      
      // CHECK IF THE PRE BUFFER IS DISCONNECTED
      if (events[i].description == "pre buffer"){
        //Logger.log("This is a pre buffer.")

        var currentEvent = events[i];
        var nextEvent = events[i + 1];

        // CHECK IF THE NEXT EVENT START IMMEDIATELY AFTER THE CURRENT EVENT ENDS, IF NOT THEN DELETE THE BUFFER
        var preBufferConnected = currentEvent.end.dateTime === nextEvent.start.dateTime;
        if (!preBufferConnected){
          Logger.log("Pre buffer is disconnected! Deleting it.");
          var removeEvent = CalendarApp.getCalendarById(calendarID).getEventById(events[i].id);
          removeEvent.deleteEvent();
        }
      }

      // CHECK IF THE POST BUFFER IS DISCONNECTED
      else if (events[i].description == "post buffer"){
        //Logger.log("This is a post buffer.")

        var currentEvent = events[i];
        var prevEvent = events[i - 1];

        // CHECK IF THE PREVIOUS EVENT ENDS IMMEDIATELY BEFORE THE CURRENT EVENT STARTS, IF NOT THEN DELETE THE BUFFER
        var postBufferConnected = currentEvent.start.dateTime === prevEvent.end.dateTime;
        if (!postBufferConnected){
          Logger.log("Post buffer is disconnected! Deleting it.");
          var removeEvent = CalendarApp.getCalendarById(calendarID).getEventById(events[i].id);
          removeEvent.deleteEvent();
        }  
      }
    }

    // ============================================================================================================== //
    // ELSE THE EVENT IS NOT BUFFER
    // 
    // CREATE 30 MIN BUFFERS BEFORE AND AFTER THE EVENT
    // [ 30 MIN BUFFER ][ EVENT ][ 30 MIN BUFFER ]
    //
    else{


      // PRE BUFFER START AND END TIMES
      var preBufferEnd = new Date(events[i].start.dateTime);
      var preBufferStart = new Date(events[i].start.dateTime);
      preBufferStart.setMinutes(preBufferEnd.getMinutes() - bufferLength);

      // POST BUFFER START AND END TIMES
      var postBufferStart = new Date(events[i].end.dateTime);
      var postBufferEnd = new Date(events[i].end.dateTime);
      postBufferEnd.setMinutes(postBufferStart.getMinutes() + bufferLength);


      // ================================================================================= //
      // ================================== PRE BUFFER =================================== //
      // ================================================================================= //

      var eventCheck = CalendarApp.getCalendarById(calendarID).getEvents(preBufferStart, preBufferEnd);
      // CHECK IF THERE IS ALREADY A PRE BUFFER
      var eventWithTitleExists = eventCheck.some(function (eventCheck) {
        return eventCheck.getTitle() === '-';
      });
      // LOG THE RESULT
      if (eventWithTitleExists) {
        Logger.log('PRE BUFFER EXISTS.');
      }
      else{
        // CREATE PRE BUFFER
        var event = CalendarApp.getCalendarById(calendarID).createEvent(
          '-',
          preBufferStart,
          preBufferEnd,
          { description: 'pre buffer'}
        );
        
        // SET PRE BUFFER COLOR
        if (bufferColor == 'RED') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'ORANGE') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'YELLOW') {event.setColor(CalendarApp.EventColor.YELLOW)}
        else if (bufferColor == 'GREEN') {event.setColor(CalendarApp.EventColor.GREEN)}
        else if (bufferColor == 'BLUE') {event.setColor(CalendarApp.EventColor.BLUE)}
        else {event.setColor(CalendarApp.EventColor.PURPLE)};
      }

      // ================================================================================= //
      // DISPLAY WHICH EVENT IS CURRENTLY BEING PROCESSED
      // FORMAT THE DATE OUTPUT
      //
      const dateTime = new Date(events[i].start.dateTime)
      const formattedDateTime = new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
        }).format(dateTime);

      Logger.log(events[i].summary + " " + formattedDateTime);


      const dateTimeString = "2023-11-09T16:30:00-06:00";

      // // Convert to Date object
      // const dateTime = new Date(dateTimeString);

      // // Format the date and time
      // const formattedDateTime = new Intl.DateTimeFormat('en-US', {
      //   year: '2-digit',
      //   month: '2-digit',
      //   day: '2-digit',
      //   hour: '2-digit',
      //   minute: '2-digit',
      //   timeZoneName: 'short'
      // }).format(dateTime);

      // console.log('Formatted Date and Time:', formattedDateTime);


      // ================================================================================= //
      // ================================= POST BUFFER =================================== //
      // ================================================================================= //

      var eventCheck = CalendarApp.getCalendarById(calendarID).getEvents(postBufferStart, postBufferEnd);
      // CHECK IF THERE IS ALREADY A POST BUFFER
      var eventWithTitleExists = eventCheck.some(function (eventCheck) {
        return eventCheck.getTitle() === '-';
      });
      // LOG THE RESULT
      if (eventWithTitleExists) {
        Logger.log('POST-BUFFER EXISTS.');
      }
      else{
        // CREATE POST BUFFER 
        var event = CalendarApp.getCalendarById(calendarID).createEvent(
          '-',
          postBufferStart,
          postBufferEnd,
          { description: 'post buffer'}
        );

        // SET POST BUFFER COLOR
        if (bufferColor == 'RED') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'ORANGE') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'YELLOW') {event.setColor(CalendarApp.EventColor.YELLOW)}
        else if (bufferColor == 'GREEN') {event.setColor(CalendarApp.EventColor.GREEN)}
        else if (bufferColor == 'BLUE') {event.setColor(CalendarApp.EventColor.BLUE)}
        else {event.setColor(CalendarApp.EventColor.PURPLE)};
      }
    }





    // ================================================================================= //
    try{  
      service.update(events[i], calendarID, events[i].id);
    }
    catch(e){
      Logger.log(e);
    }
  }
}