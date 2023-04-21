// define a function to filter the events
function filterEvents() {
    // get the selected checkboxes for each filter
    var interests = Array.from(document.querySelectorAll('input[name="interest"]:checked')).map(interest => interest.value);
    var budget = document.getElementById('budget').value;
    var distance = document.getElementById('distance').value;
}
    //Save Events
    var events = {
      name: "Event List", 
      interest: interests,
      budget: budget,
      distance: distanceInput
    }

  // filter the events based on the selected checkboxes
  const filteredEvents = events.filter(evt => {
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
  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '';
  if (filteredEvents.length) {
    filteredEvents.forEach(evt => {
      const eventElement = document.createElement('div');
      eventElement.innerHTML = `<h2>${evt.name}</h2><p>Interest: ${evt.interest}</p><p>Budget: ${evt.budget}</p><p>Distance: ${evt.distance}</p>`;
      eventsList.appendChild(eventElement);
    });
  } else {
    eventsList.innerHTML = '<p>No events match the selected criteria.</p>';
  }

mobiscroll.setOptions({
  theme: 'windows',
  themeVariant: 'dark'
});
  
$(function () {
  $('#demo-time').mobiscroll().datepicker({
      controls: ['time'],
      select: 'range',
      display: 'inline',
      onChange: function(ev, inst) {
          console.log(ev.value); // the selected ID
        },
      });
  });
