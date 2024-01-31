function myFunction() {
  // THIS SCRIPT CREATES "BUFFER" EVENTS BEFORE AND AFTER NEWLY CREATED CALENDAR EVENTS

  // UPDATES
  // 11-15-23 ADDED event.removeAllReminders() FOR PRE AND POST BUFFERS
  // 11-20-23 REMOVED Logger.log("This is a pre buffer.") AND Logger.log("This is a post buffer.")
  // 01-02-24 ADDED FUNCTIONALITY TO REMOVE OVERLAPPING BUFFERS


  // USER INPUT CALENDAR
  const calendar = "Grant Sessions"; // NAME OF CALENDAR BEING MODIFIED
  const calendarID = CalendarApp.getCalendarsByName(calendar)[0].getId(); // GET CALENDAR ID
  Logger.log("Modifying buffers for calendarID: " + calendarID);


  // USER INPUT BUFFER LENGTH (IN MINUTES)
  const bufferLength = 30;


  // USER INPUT BUFFER COLOR
  const bufferColor = 'RED';

  // SET DATE RANGE (DEFAULT IS 90 DAYS FROM THE CURRENT DAY)
  var startDate = new Date(); // START DATE OF THE RANGE TO BE MODIFIED
  startDate.setHours(0,0,0,0); // SET TO THE BEGINNING OF THE CURRENT DAY

  var endDate   = new Date(); // END DATE OF THE RANGE TO BE MOFIFIED (90 DAYS FROM TODAY)
  endDate.setDate(startDate.getDate() + 90);
  endDate.setHours(0,0,0,0); // SET TO THE BEGINNING OF THE DAY

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

  // INITIAL ORDER OF EVENTS
  for (i = 0; i < events.length; i++) {
    Logger.log("ORDER: " + events[i].summary);
  }
  Logger.log("");

  // ============================================================================================================== //
  // SEARCH THROUGH EVENTS
  
  for (i = 0; i < events.length; i++) {    

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

      Logger.log("CURRENTLY PROCESSING: " + events[i].summary + " " + formattedDateTime);

    // ============================================================================================================== //
    // IF THE EVENT IS A BUFFER
    //
    // TEST IF AN EVENT WAS DELETED, IF SO THEN DELETE THE BUFFER EVENTS CONNECTED TO IT
    // METHOD: IF EITHER THE PRE BUFFER OR POST BUFFER BECOMES DISCONNECTED FROM THE EVENT, THEN DELETE IT
    //
    // CHECK IF THE PRE BUFFER IS DISCONNECTED
    if (events[i].summary == "-") {
      
      if (events[i].description == "pre buffer"){

        var currentEvent = events[i];
        var nextEvent = events[i + 1];

        // CHECK IF THE NEXT EVENT STARTS IMMEDIATELY AFTER THIS PRE-BUFFER ENDS, IF NOT THEN DELETE THIS PRE-BUFFER
        var preBufferConnected = currentEvent.end.dateTime === nextEvent.start.dateTime;
        if (!preBufferConnected){
          Logger.log("Pre buffer is disconnected! Deleting it.");
          var removeEvent = CalendarApp.getCalendarById(calendarID).getEventById(events[i].id);
          removeEvent.deleteEvent();
        }
      }

      // CHECK IF THE POST BUFFER IS DISCONNECTED
      else if (events[i].description == "post buffer"){

        var currentEvent = events[i];
        Logger.log("Post buffer - current event[i] = " + events[i].summary);

        // EDGE CASE: A POST BUFFER IS ACTING AS BOTH A PRE AND POST BUFFER - SKIP THE CURRENT ITERATION
        // BECAUSE THERE IS NO EVENT BEFORE THE CURRENT EVENT SO events[i-1] IS OUT OF BOUNDS
        if (i == 0)
          continue;

        var prevEvent = events[i - 1];
        Logger.log("Post buffer - previous event[i-1] = " + events[i-1].summary);

        // EDGE CASE: WHEN AN EVENT IS MOVED ONTOP OF A PREVIOUS EVENT, 
        // THE FIRST EVENT'S POST-BUFFER COMES AFTER THE SECOND EVENT STARTS,
        // INSTEAD OF THE FIRST EVENT THAT IT IS ATTACHED TO, THEN SKIP THE CURRENT ITERATION
        if (prevEvent.end.dateTime > currentEvent.start.dateTime)
          continue;

        // CHECK IF THE PREVIOUS EVENT ENDS IMMEDIATELY BEFORE THIS POST-BUFFER STARTS, IF NOT THEN DELETE THIS POST-BUFFER
        var postBufferConnected = currentEvent.start.dateTime === prevEvent.end.dateTime;
        if (!postBufferConnected){
          Logger.log("Post buffer is disconnected! Deleting it.");
          var removeEvent = CalendarApp.getCalendarById(calendarID).getEventById(events[i].id);
          removeEvent.deleteEvent();
        }  
      }
    }

    // ELSE, THE EVENT IS NOT A BUFFER
    //
    // CREATE 30 MIN BUFFERS BEFORE AND AFTER THE EVENT
    // [ 30 MIN BUFFER ][ EVENT ][ 30 MIN BUFFER ]

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
        Logger.log("Creating PRE-BUFFER");
        var event = CalendarApp.getCalendarById(calendarID).createEvent(
          '-',
          preBufferStart,
          preBufferEnd,
          { description: 'pre buffer'}
        );

        // REMOVE DEFAULT 1HR REMINDER
        event.removeAllReminders();

        
        // SET PRE BUFFER COLOR
        if (bufferColor == 'RED') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'ORANGE') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'YELLOW') {event.setColor(CalendarApp.EventColor.YELLOW)}
        else if (bufferColor == 'GREEN') {event.setColor(CalendarApp.EventColor.GREEN)}
        else if (bufferColor == 'BLUE') {event.setColor(CalendarApp.EventColor.BLUE)}
        else {event.setColor(CalendarApp.EventColor.PURPLE)};
      }

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
        Logger.log("Creating POST-BUFFER");
        var event = CalendarApp.getCalendarById(calendarID).createEvent(
          '-',
          postBufferStart,
          postBufferEnd,
          { description: 'post buffer'}
        );

        // REMOVE DEFAULT 1HR REMINDER
        event.removeAllReminders();

        // SET POST BUFFER COLOR
        if (bufferColor == 'RED') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'ORANGE') {event.setColor(CalendarApp.EventColor.RED)}
        else if (bufferColor == 'YELLOW') {event.setColor(CalendarApp.EventColor.YELLOW)}
        else if (bufferColor == 'GREEN') {event.setColor(CalendarApp.EventColor.GREEN)}
        else if (bufferColor == 'BLUE') {event.setColor(CalendarApp.EventColor.BLUE)}
        else {event.setColor(CalendarApp.EventColor.PURPLE)};
      }
    }
  } // END OF FIRST SEARCH

  // ============================================================================================================== //
  // NOW SEARCH THROUGH EVENTS AGAIN...
  // CHECK IF THERE IS A BUFFER OVERLAPPING INTO AN EVENT, IF SO, THEN DELETE THE BUFFER
  
  for (i = 0; i < events.length; i++) {
    if (events[i].summary != '-'){
      Logger.log("Testing for overlap: " + events[i].summary);

      var eventCheck = CalendarApp.getCalendarById(calendarID).getEvents(new Date(events[i].start.dateTime), new Date(events[i].end.dateTime));
      // CHECK IF THERE IS ALREADY A PRE BUFFER
      var eventWithTitleExists = eventCheck.some(function (eventCheck) {
        return eventCheck.getTitle() === '-';
      });
      // LOG THE RESULT
      if (eventWithTitleExists) {
        for (var x = 0; x < eventCheck.length; x++){
          if (eventCheck[x].getTitle() == '-'){
            Logger.log("Deleting Overlap Event: " + eventCheck[x].getTitle() + " " + eventCheck[x].getStartTime());
            var removeEvent = CalendarApp.getCalendarById(calendarID).getEventById(eventCheck[x].getId());
            removeEvent.deleteEvent();
          }
        }
      }
    }
  }
  
  Logger.log("END.")
}
