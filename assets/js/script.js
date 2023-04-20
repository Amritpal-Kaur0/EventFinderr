// Helper function to get the date range for the upcoming weekend
function getUpcomingWeekendDateRange() {
  const today = new Date();
  const nextFriday = new Date(today);
  nextFriday.setDate(today.getDate() + ((5 - today.getDay()) % 7));

  const nextSunday = new Date(nextFriday);
  nextSunday.setDate(nextFriday.getDate() + 2);

  const startDate = nextFriday.toISOString().split("T")[0];
  const endDate = nextSunday.toISOString().split("T")[0];

  return { startDate, endDate };
}
let isLocationUpdated = false;

// Fetch events from Ticketmaster API for a specific date range
async function getEvents() {
  const apiKeyTicketMaster = "xahcBviTrD5wt7duynUO6G7x2HkhwDKp";
  const { startDate, endDate } = getUpcomingWeekendDateRange();
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?city=${city}&startDateTime=${startDate}T00:00:00Z&endDateTime=${endDate}T23:59:59Z&apikey=${apiKeyTicketMaster}`;
  console.log(url);
  const response = await fetch(url);
  const data = await response.json();
  return data._embedded.events;
}
// Calculate travel time and distance between two points using Bing Maps API
async function getTimeAndDistance(origin, destination, travelMode) {
  const apiKeyBingMaps =
    "AiIMmp6rNENDUYfZjjPyk6DynJOPYEc1cxG6szcKMSUJH889pMIC_XeVnLVyYnSW";
  const mode = travelMode === "Transit" ? "transit" : travelMode.toLowerCase();
  const url = `https://dev.virtualearth.net/REST/v1/Routes/${mode}?wp.0=${address}&wp.1=${destination}&key=${apiKeyBingMaps}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);
  const route = data.resourceSets[0].resources[0];
  return {
    distance: route.travelDistance,
    time: route.travelDuration,
  };
}
// provides auto suggestion, work in progres just provides a list of the same suggestions currently.
async function getAutosuggestResults(query) {
  const apiKeyBingMaps =
    "AiIMmp6rNENDUYfZjjPyk6DynJOPYEc1cxG6szcKMSUJH889pMIC_XeVnLVyYnSW";
  const url = `https://dev.virtualearth.net/REST/v1/Autosuggest?query=${query}&maxResults=6&key=${apiKeyBingMaps}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.resourceSets[0].resources[0].value;
}

// // Get the location coordinates and address using Bing Maps API
async function getLocation(address) {
  const apiKeyBingMaps =
    "AiIMmp6rNENDUYfZjjPyk6DynJOPYEc1cxG6szcKMSUJH889pMIC_XeVnLVyYnSW";
  const url = `https://dev.virtualearth.net/REST/v1/Locations?query=${address}&key=${apiKeyBingMaps}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.resourceSets[0].resources[0];
}

var city = "";

// Handle address input and display address suggestions --- got address to work and show events for selected city.
async function handleAddressInput() {
  const input = document.getElementById("user-location");
  const inputValue = input.value.trim();
  const suggestionsContainer = document.getElementById("address-suggestions");
  const invalidAddressWarning = document.getElementById(
    "invalid-address-warning"
  );

  if (input && inputValue) {
    const suggestions = await getAutosuggestResults(inputValue);
    suggestionsContainer.innerHTML = "";

    if (suggestions.length === 0) {
      invalidAddressWarning.style.display = "block";
    } else {
      invalidAddressWarning.style.display = "none";

      suggestions.forEach((suggestion) => {
        const suggestionElement = document.createElement("div");
        suggestionElement.textContent = suggestion.address.formattedAddress;
        suggestionElement.classList.add("address-suggestion");
        suggestionElement.addEventListener("click", () => {
          input.value = suggestion.address.formattedAddress;
          suggestionsContainer.innerHTML = "";
          city = suggestion.address.locality;
          address = input.value;
          console.log(suggestion);
          isLocationUpdated = true;
          displayEvents(city);
        });
        suggestionsContainer.appendChild(suggestionElement);
      });
    }
  } else {
    suggestionsContainer.innerHTML = "";
    invalidAddressWarning.style.display = "none";
  }
  // Add event listener for input change
  input.addEventListener("input", function () {
    const updatedCity = input.value;
    if (isLocationUpdated && updatedCity !== city) {
      city = updatedCity;
      displayEvents(city);
    }
  });
  const locationInput = document.getElementById("user-location");
  locationInput.addEventListener("input", handleAddressInput);
}

// Calculate and display travel information for different travel mode
async function calculateTravelInfo(origin, destination) {
  const travelModes = ["Walking", "Driving", "Transit"];
  const travelInfo = {};

  for (const mode of travelModes) {
    const data = await getTimeAndDistance(origin, destination, mode);
    travelInfo[mode] = data;
  }

  return travelInfo;
}

function displayTravelInfo(travelInfo) {
  const travelInfoContainer = document.getElementById("travel-info");
  travelInfoContainer.innerHTML = "";

  for (const mode in travelInfo) {
    const modeInfo = document.createElement("div");
    modeInfo.classList.add("travel-info-mode");
    modeInfo.textContent = `${mode}: ${travelInfo[mode].distance.toFixed(
      2
    )} km`;
    console.log(travelInfo);
    travelInfoContainer.appendChild(modeInfo);
  }
}

// Display event data and attach click event listeners to show travel information
// Display event data and attach click event listeners to show travel information
async function displayEvents(userLocation) {
  // Get events based on the user location
  const events = await getEvents(userLocation);
  // Get the event container element and clear its content
  const eventContainer = document.getElementById("event-container");
  eventContainer.innerHTML = "";

  // Loop through each event and create a new event element
  events.forEach((event) => {
    const eventElement = document.createElement("div");
    eventElement.classList.add("event");

    // Create an event title element and set its text content to the event name
    const eventTitle = document.createElement("div");
    eventTitle.classList.add("event-title");
    eventTitle.textContent = event.name;

    // Create an event time element and set its text content to the event start time
    const eventTime = document.createElement("div");
    eventTime.classList.add("event-time");
    eventTime.textContent = new Date(
      event.dates.start.dateTime
    ).toLocaleString();

    // Add the event title and time elements to the event element
    eventElement.appendChild(eventTitle);
    eventElement.appendChild(eventTime);

    // Attach a click event listener to the event element that shows travel information
    eventElement.addEventListener("click", async function () {
      const selectedEventContainer = document.getElementById("selected-event");
      selectedEventContainer.innerHTML = "";

      const clonedEventElement = eventElement.cloneNode(true);
      selectedEventContainer.appendChild(clonedEventElement);

      const destination =
        event._embedded.venues[0].address.line1 +
        ", " +
        event._embedded.venues[0].city.name;
      const travelInfo = await calculateTravelInfo(userLocation, destination);
      displayTravelInfo(travelInfo);
    });

    // Add the event element to the event container
    eventContainer.appendChild(eventElement);
  });
}

// Filter events based on the user location and selected interests
async function filterEvents() {
  // Get events based on the user location
  const userLocation = document.getElementById("location-input").value;
  const events = await getEvents(userLocation);

  // Get the event container element and clear its content
  const eventContainer = document.getElementById("event-container");
  eventContainer.innerHTML = "";

  // Get the selected interests from the checkboxes
  const sportsSelected = document.getElementById("interest-sports").checked;
  const musicSelected = document.getElementById("interest-music").checked;
  const artsTheaterSelected = document.getElementById("interest-arts").checked;
  const familySelected = document.getElementById("interest-family").checked;

  // Loop through each event and create a new event element if it matches the selected interests
  events.forEach((event) => {
    // Get the category and family of the event
    const category = event.classifications[0].segment.name.toLowerCase();
    const isFamily = event.classifications[0].family;
    console.log(event);
    // Determine whether the event should be shown based on the selected interests
    const showSports = sportsSelected && category === "sports" && !isFamily;
    const showMusic = musicSelected && category === "music" && !isFamily;
    const showArtsTheater =
      artsTheaterSelected &&
      (category === "arts & theatre" || category === "arts & theater") &&
      !isFamily;
    const showFamily = familySelected && isFamily;

    // Create a new event element if it matches the selected interests
    if (showSports || showMusic || showArtsTheater || showFamily) {
      // Create a new div element with the class "event"
      const eventElement = document.createElement("div");
      eventElement.classList.add("event");

      // Create a new div element with the class "event-title" and set its text content to the name of the event
      const eventTitle = document.createElement("div");
      eventTitle.classList.add("event-title");
      eventTitle.textContent = event.name;

      // Create a new div element with the class "event-time" and set its text content to the start date/time of the event
      const eventTime = document.createElement("div");
      eventTime.classList.add("event-time");
      eventTime.textContent = new Date(
        event.dates.start.dateTime
      ).toLocaleString();

      // Append the event title and event time elements to the event element
      eventElement.appendChild(eventTitle);
      eventElement.appendChild(eventTime);

      // Add a click event listener to the event element
      eventElement.addEventListener("click", async function () {
        // Get the element with the ID "selected-event" and clear its contents
        const selectedEventContainer =
          document.getElementById("selected-event");
        selectedEventContainer.innerHTML = "";

        // Clone the event element and append it to the selected event container
        const clonedEventElement = eventElement.cloneNode(true);
        selectedEventContainer.appendChild(clonedEventElement);

        // Calculate the travel information from the user's location to the event's venue and display it
        const destination =
          event._embedded.venues[0].address.line1 +
          ", " +
          event._embedded.venues[0].city.name;
        const travelInfo = await calculateTravelInfo(userLocation, destination);
        displayTravelInfo(travelInfo);
      });

      // Append the event element to the container for events
      eventContainer.appendChild(eventElement);
    }
  });
}
// Call filterEvents to initially show all events
filterEvents();

// Wait for the user to select any of the checkboxes
document.querySelectorAll('input[name="interest"]').forEach((checkbox) => {
  checkbox.addEventListener("change", function () {
    // Call filterEvents to filter the events based on the selected interests
    filterEvents();
    // Check if all checkboxes are unchecked and display all events if they are
    const allUnchecked = !Array.from(
      document.querySelectorAll('input[name="interest"]')
    ).some((checkbox) => checkbox.checked);
    if (allUnchecked) {
      displayEvents(document.getElementById("location-input").value);
    }
  });
});

async function filterEventsByDate() {
  const userLocation = document.getElementById("location-input").value;
  const events = await getEvents(userLocation);

  const eventContainer = document.getElementById("event-container");
  eventContainer.innerHTML = "";

  const dateInput = document.getElementById("startDate").value;
  const inputDate = new Date(dateInput);

  events.forEach((event) => {
    const eventDate = new Date(event.dates.start.localDate);

    if (
      eventDate.getFullYear() === inputDate.getFullYear() &&
      eventDate.getMonth() === inputDate.getMonth() &&
      eventDate.getDate() === inputDate.getDate()
    ) {
      const eventElement = document.createElement("div");
      eventElement.classList.add("event");

      const eventTitle = document.createElement("div");
      eventTitle.classList.add("event-title");
      eventTitle.textContent = event.name;

      const eventTime = document.createElement("div");
      eventTime.classList.add("event-time");
      eventTime.textContent = new Date(
        event.dates.start.dateTime
      ).toLocaleString();

      eventElement.appendChild(eventTitle);
      eventElement.appendChild(eventTime);

      eventElement.addEventListener("click", async function () {
        const selectedEventContainer =
          document.getElementById("selected-event");
        selectedEventContainer.innerHTML = "";

        const clonedEventElement = eventElement.cloneNode(true);
        selectedEventContainer.appendChild(clonedEventElement);

        const destination =
          event._embedded.venues[0].address.line1 +
          ", " +
          event._embedded.venues[0].city.name;
        const travelInfo = await calculateTravelInfo(userLocation, destination);
        displayTravelInfo(travelInfo);
      });

      eventContainer.appendChild(eventElement);
    }
  });
}

// Add event listener for date input change
const dateInput = document.getElementById("startDate");
dateInput.addEventListener("input", filterEventsByDate);
