var resetTimer = 30;
var count=resetTimer;
var counter = null;

var tile_ids = [];
var monitors = [];

var apiKey = 'u128481-b07c1e2e3752ea582d89e5c5';
var statusURL = 'http://api.uptimerobot.com/getMonitors';
var data = {apiKey:apiKey, responseTimes:0, format:'json', noJsonCallback: 1};

var el = document.getElementById('dashboard');
var grid = new Tiles.Grid(el);

// create a custom Tile which customizes the resize behavior
function CustomTile(tileId, element) {
    // initialize base
    Tiles.Tile.call(this, tileId, element);
}

CustomTile.prototype = new Tiles.Tile();

CustomTile.prototype.resize = function(cellRect, pixelRect, animate, duration, onComplete) {
  var m = getMonitor(this.id);
  /*
  0 - paused
  1 - not checked yet
  2 - up
  8 - seems down
  9 - down
  */
  var lastResponse = m.responsetime != null ? m.responsetime[0].value : -1;
  var uptimeRatio = m.alltimeuptimeratio;
  
  this.$el.removeClass();
  
  switch(m.status) {
    case '2':
      if (lastResponse > 1000)
        this.$el.addClass('yellow');
      else
        this.$el.addClass('green');
      break;
    case '8':
    case '9':
      this.$el.addClass('red');
      break;
    default:
      this.$el.addClass('grey');
  }
  
  // set the texts inside the tile
  this.$el.find('.title').text(m.friendlyname);
  this.$el.find('.uptime').text(uptimeRatio + '%');
  this.$el.find('.lastresponse').text(lastResponse + 'ms');

  // call the base to perform the resize
  Tiles.Tile.prototype.resize.call(this, cellRect, pixelRect, animate, duration, onComplete);
};

grid.createTile = function(tileId) {
  var tile = new CustomTile(tileId);
  tile.$el.append('<div class="title"></div>');
  tile.$el.append('<div class="stat uptime"></div>');
  tile.$el.append('<div class="stat lastresponse"></div>');
  return tile;
};

function sortByName(a, b) {
  var aName = a.friendlyname.toLowerCase();
  var bName = b.friendlyname.toLowerCase(); 
  
  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function sortByResponse(a, b) {
  var aName = a.responsetime != null ? a.responsetime[0].value : -1;
  var bName = b.responsetime != null ? B.responsetime[0].value : -1; 
  
  return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function timer() {
  count=count-1;
  if (count <= 0) {
     clearInterval(counter);
     count = resetTimer;
     
     fetchData();
     return;
  }

  $("#countdown").text(count)
}

function updateGrid() {
  // update the set of tiles and redraw the grid
  grid.isDirty = true; //force update
  grid.updateTiles(tile_ids);
  grid.redraw(true);
}

function getMonitor(monitorId) {
  var m = null;
  
  $.each(monitors.monitor, function(e) {
	  if (this.id == monitorId) {
	    m = this; //TODO: Break out of loop when found!
	  }
	});
	
	return m;
}

function jsonUptimeRobotApi() {
  alert('callback');
}

function fetchData() {
  $.ajax({
  	url: statusURL,
  	data: data
  }).done(function(e) {
    console.log('Done');
    
    tile_ids = [];
    monitors = e.monitors;

    monitors.monitor.sort(sortByName);

  	$.each(monitors.monitor, function(e) {
  	  tile_ids.push(this.id);
  	});

  	//update grid
  	updateGrid();
  	//reset timer
  	counter=setInterval(timer, 1000);
    
  }).fail(function(xhr, status, error) {
    console.log('Failed: ' + status);
  }).always(function(xhr, status) {
    console.log('Log: ' + new Date());
  });
}

$(function() {
  fetchData();
  
  // wait until user finishes resizing the browser
  var debouncedResize = debounce(function() {
      grid.resize();
      grid.redraw(true);
  }, 200);

  // when the window resizes, redraw the grid
  $(window).resize(debouncedResize);
});
    



