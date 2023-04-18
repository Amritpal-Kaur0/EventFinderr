//Filter Page JS
// define a function to filter the events
function filterEvents() {
  // get the selected checkboxes for each filter
  var interests = Array.from(
    document.querySelectorAll('input[name="interest"]:checked')
  ).map((interest) => interest.value);
  var budget = document.getElementById("budget").value;
  var distance = document.getElementById("distance").value;
}
//Save Events
var events = {
  name: "Event List",
  interest: interests,
  budget: budget,
  distance: distanceInput,
};

// filter the events based on the selected checkboxes
const filteredEvents = events.filter((evt) => {
  if (interests.length && !interests.includes(evt.interest)) {
    return false;
  }
  if (budgets.length && !budgets.includes(evt.budget)) {
    return false;
  }
  if (distances.length && !distances.includes(evt.distance)) {
    return false;
  }
  return true;
});

// display the filtered events
const eventsList = document.getElementById("events-list");
eventsList.innerHTML = "";
if (filteredEvents.length) {
  filteredEvents.forEach((evt) => {
    const eventElement = document.createElement("div");
    eventElement.innerHTML = `<h2>${evt.name}</h2><p>Interest: ${evt.interest}</p><p>Budget: ${evt.budget}</p><p>Distance: ${evt.distance}</p>`;
    eventsList.appendChild(eventElement);
  });
} else {
  eventsList.innerHTML = "<p>No events match the selected criteria.</p>";
}

mobiscroll.setOptions({
  theme: "windows",
  themeVariant: "dark",
});

$(function () {
  $("#demo-time")
    .mobiscroll()
    .datepicker({
      controls: ["time"],
      select: "range",
      display: "inline",
      onChange: function (ev, inst) {
        console.log(ev.value); // the selected ID
      },
    });
});

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
    )} km, ${travelInfo[mode].time.toFixed(0)} minutes`;
    travelInfoContainer.appendChild(modeInfo);
  }
}
// Display event data and attach click event listeners to show travel information
async function displayEvents(userLocation) {
  const events = await getEvents(userLocation);
  const eventContainer = document.getElementById("event-container");
  eventContainer.innerHTML = "";

  events.forEach((event) => {
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

    eventElement.addEventListener("click", async () => {
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

    eventContainer.appendChild(eventElement);
  });
}

// Initialize the app
(async function init() {
  await displayEvents();
  const saveBtn = document.getElementById("save-btn");
  saveBtn.addEventListener("click", saveEvents);

  const updateLocationBtn = document.getElementById("update-location");
  updateLocationBtn.addEventListener("click", async () => {
    const userLocationInput = document.getElementById("user-location");
    const userLocation = userLocationInput.value.trim();
    if (userLocation) {
      const location = await getLocation(userLocation);
      if (location) {
        const coordinates = location.point.coordinates;
        const formattedAddress = location.address.formattedAddress;
        await displayEvents(`${coordinates[0]},${coordinates[1]}`);
        const savedLocationDiv = document.getElementById("saved-location");
        savedLocationDiv.textContent = `Saved location: ${formattedAddress}`;
      } else {
        alert("Please enter a valid location.");
      }
    } else {
      alert("Please enter a valid location.");
    }
  });
})();

$(function() {
  var startTime
  var endTime
  function appendPicker() {
    $(".daterange").append($(".daterangepicker"))
  }
  $('input[name="datetimes"]').daterangepicker({
      timePicker: true,
      startDate: moment().startOf('hour'),
      endDate: moment().startOf('hour').add(32, 'hour'),
      locale: {
      format: 'hh:mm A'
      }
  });
  appendPicker()
    function bleh() {
      console.log(startTime)
      console.log(endTime)
    }
    $('#daterange').on('apply.daterangepicker', function(ev, picker) {
      startTime = (picker.startDate.format('YYYY-MM-DD h:mm A'));
      endTime = (picker.endDate.format('YYYY-MM-DD h:mm A'));
      window.startTime = startTime
      console.log(startTime)
      console.log(endTime)
      bleh()
    });
});
