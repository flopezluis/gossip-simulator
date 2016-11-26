num_nodes = 40;
fanout = 4;
INFECTIVE = 1;
REMOVING = 3;
SEND_TEST_MESSAGE = 5;
PLAY = 6;
state = INFECTIVE;

lastTick = 0;
cycleTime = 1000;
center = [310, 290];

cycle = undefined; 
radius = 240;
cycle_counter =0;
nodes = [];
activeNodes = [];
msgs = [];
colors = ['#5d8aa8', '#FCE374', '#35E81A', 'grey', '#705D07', '#88C76D', '#E87654', '#bcd4e6', '#89cff0', '#007fff', '#a1caf1', '#2C58E8', '#C7469C', 'DarkCyan', '#3BCCC2', '#7C5ACC', '#87CCA5', '#85727B', '#851B5A', '#857E1B'];


init();
createButtons();

function getUniqueRandom(list, n, except) {
  /*It returns a list of non-repeated elements */
  var selectedElements = [];
  selected = undefined;
  for (i=0;i<n;i++) {
    while (selectedElements.indexOf(selected) > -1 || selected == except || !selected) {
      var index = getRandom(0, list.length-1);
      selected = list[index];
    }
    selectedElements.push(selected);
  }
  return selectedElements;
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function remove_array_value(array, value) {
  var index = array.indexOf(value);
  if (index >= 0) {
    array.splice(index, 1);
  }
}

function getColor() {
  var index = Math.floor(Math.random() * colors.length);
  var color = colors[index];
  return color;
}

function createMessages() {
  /* Messages send from nodes. These messages are precalculated. */
  var total = fanout * num_nodes;
  for (j=0; j < total; j++) {
    cir = Path.Circle({center: center, radius:10,strokeWidth: 2, strokeColor: 'red'});
    msgs.push(cir);
  }
}

function init() {
  /*Set every component to its initial state*/
  cycle_counter =0;
  nodes = [];
  activeNodes = [];
  msgs = [];
  createMessages();
  locateNodes();
  createClusterMembership();

  cycle = new PointText({
    point: center,
    justification: 'center',
    fontSize: 32,
    strokeWidth: 4,
    strokeColor: 'black',
    fillColor: 'black'
  });
  cycle.content = "Cycle"
  log_cycle = new PointText({
    point: [center[0], center[1] + 50],
    justification: 'center',
    fontSize: 24,
    strokeWidth: 3,
    fillColor: 'black'
  });
  log_cycle.content = "log(" + num_nodes +") (base " + fanout +") = " + log(num_nodes, fanout) ;
  lastTick = new Date().getTime();
}

function createClusterMembership() {
  /* It precalculates the view that every node has and the paths from the origen node to destination*/
  for (var j=0; j<num_nodes;j++) {
    destinations = getUniqueRandom(nodes, num_nodes/2, nodes[j]);
    nodes[j].membership = [];
    nodes[j].paths = [];
    for (index in destinations) {
      destination = destinations[index];
      var path = new Path.Line(nodes[j].position, destination.position);
      path.strokeWidth = 3;
      path.strokeColor = nodes[j].fillColor;
      path.visible = false;
      /* This is used to show how even deleting links gossip still propagates*/
      path.onClick = function(event) {
        switch (state) {
          case REMOVING:
            remove_array_value(this.origen.membership, this.destination); 
            remove_array_value(this.origen.paths, this); 
            this.remove()
            break;
        }
      }
      path.origen = nodes[j];
      path.destination = destination;
      nodes[j].membership.push(destination);
      nodes[j].paths.push(path);
    }
  }
}

function clear() {
  /*Restart every component to start the simulator from scratch*/
  paper.project.layers[0].clear();
  init();
  state = INFECTIVE;
  $("#play").attr('class', 'btn btn-warning');
  for (var i=0;i<nodes.length;i++) {
    for (index in nodes[i].paths) {
      nodes[i].paths[index].visible = false;
      nodes[i].paths[index].is_destination = false;
      nodes[i].paths[index].strokeWidth = 3;
    }
    nodes[i].strokeColor = 'black';
    nodes[i].fillColor = nodes[i].originalColor;
  }
  activeNodes = [];
  toggleButtons();
}

function createButtons() {
  $("#remove").click(function (event) {
    $("#remove").toggleClass('selected');
    event.preventDefault();
    if (state == REMOVING) {
      state = INFECTIVE;
    } else {
      state = REMOVING;
    }
  });

  $("#send_message").click(function (event) {
    event.preventDefault();
    state = SEND_TEST_MESSAGE;
    selectedNodes = activeNodes.slice();
    for (node in selectedNodes) {
      prepareFanout(selectedNodes[node]);
    }
  });

  $("#play").click(function (event) {
    event.preventDefault();
    if (activeNodes.length == 0) {
      $("#messages").text("WTF??");
      return;
    }
    if (state == PLAY) {
      state = INFECTIVE;
    } else {
      state = PLAY;
    }
    $("#play").toggleClass('selected');
  });

  $("#show_paths").click(function (event) {
    event.preventDefault();
    showPaths();
  });

  $("#clear").click(function (event) {
    event.preventDefault();
    clear();
  });

  $("#random").click(function (event) {
    event.preventDefault();
    for (var i=0;i<activeNodes.length;i++) {
      prepareFanout(activeNodes[i]);
      selectFanout(activeNodes[i]);
    }
  });

  $("#nodes").val(num_nodes);
  $("#apply").click(function (event) {
     event.preventDefault();
     num_nodes = $("#nodes").val();
     fanout= $("#fanout").val();
     clear();
  });

  $("#fanout").val(fanout);
  toggleButtons();
}

function toggleButtons() {
  if (activeNodes.length == 0) {
    $("#play").addClass("disabled");
    $("#send_message").addClass("disabled");
    $("#show_paths").addClass("disabled");
    $("#random").addClass("disabled");
  } else {
    $("#play").removeClass("disabled");
    $("#send_message").removeClass("disabled");
    $("#show_paths").removeClass("disabled");
    $("#random").removeClass("disabled");
  }
}

function selectFanout(node) {
  /* Select n (fanout) nodes randomly and highlights the selected paths*/
  for (index in node.paths) {
    node.paths[index].strokeWidth = 3;
    node.paths[index].is_destination = false;
  }
  chosen = getUniqueRandom(node.paths, fanout);
  counter = 0;
  for (index in chosen) {
    chosen[index].strokeWidth = 6;
    chosen[index].is_destination = true;
    chosen[index].msg = node.msg[counter];
    counter +=1;
  }
}

function cleanPaths(node) {
  /* Make all the paths invisible*/
  for (index in node.paths) {
    node.paths[index].visible = false;
  }
}

function showPaths() {
  /* Make all the paths visible or invisible*/
  for (var node in activeNodes) {
    selectedNode = activeNodes[node];
    for (index in selectedNode.paths) {
      selectedNode.paths[index].visible = !selectedNode.paths[index].visible;
    }
  }
}

function toggleMessages(selectedNode) {
  for (var node in nodes) {
    if (nodes[node] == selectedNode) continue;
    for (var msg in nodes[node].msg) {
      nodes[node].msg[msg].visible = !nodes[node].msg[msg].visible;
    }
  }
}

function locateNodes() {
  /*It creates the nodes*/
  slice = 2 * Math.PI / num_nodes;
  rdcolors = getUniqueRandom(colors, colors.length);
  for (i=0; i < num_nodes; i++){
    angle = slice * i;
    newX = center[0] + radius * Math.cos(angle);
    newY = center[1] + radius * Math.sin(angle);
    point = {x: newX, y: newY};
    var color = getColor();
    var path = new Path.Circle({
      center: [newX, newY],
      radius: 17,
      strokeWidth: 3,
      strokeColor: 'black',
      fillColor : color,
      originalColor : color 
    });
    path.onClick = function(event) {
      switch (state) {
        case REMOVING:
          remove_array_value(nodes, this);
          for (var index in this.msg) {
            this.msg[index].remove();
          }
          for (var index in nodes) {
            remove_array_value(nodes[index].membership, this);
            for (var path in nodes[index].paths) {
              if (nodes[index].paths[path].destination == this) {
                 nodes[index].paths.splice(path, 1);
              }
            }
          }
          this.remove()
          break;
        case INFECTIVE:
          if (activeNodes.indexOf(this) == -1) {
            activeNodes.push(this);
	    this.strokeColor= 'red';
            this.fillColor= 'red';
          } else {
	    remove_array_value(activeNodes, this);
	    this.strokeColor= 'black';
            this.fillColor= this.originalColor;
	    cleanPaths(this);
	  }
	  toggleButtons();
          break;
      }
  }
  path.dashArray = [10, 4]; /*This is used to show the cycle*/
  //add messages to the each node
  position = [path.position.x, path.position.y];
  path.msg = [];
  for (j=0; j < fanout; j++) {
    cir = msgs.pop();
    cir.position = position;
    cir.strokeColor = color;
    cir.fillColor= color;
    cir.origen = position;
    path.msg.push(cir);
  }
  nodes.push(path);
  }
}

function log(x, base) {
  return (Math.log(x)/Math.log(base)).toFixed(2);
}

function sendingMsg(node) {
  /*It moves the messages of this node to destination.
  * Until it's really close to destination */
  for (index in node.paths) {
    if (node.paths[index].is_destination) {
      destination = node.paths[index].destination;
      var vector = destination.position - node.paths[index].msg.position;
      var dis = destination.position.getDistance(node.paths[index].msg.position);

      if (dis > 5) { //arrives at destination
        node.paths[index].msg.position += (vector / 20); 
      } else {
        if (activeNodes.indexOf(destination) == -1) {
	  /*it's arrived to destination, then destination is infected*/
          destination.strokeColor='red';
          destination.fillColor='red';
          activeNodes.push(destination);
        }
        node.paths[index].is_destination = false;
        if (state == SEND_TEST_MESSAGE) {
	  /*In this phase the new infected nodes don't infect others unless we click in the button send message*/
          still_working = node.paths.filter(function (e) {
            return e.is_destination;});
          if (still_working.length == 0) {
            remove_array_value(selectedNodes, node);
          }
        }
      }
    }
  }
}


function prepareFanout(node) {
    /* It relocates the nessages*/
    for (i=0;i<fanout;i++) {
        node.msg[i].position.x = node.msg[i].origen[0];
        node.msg[i].position.y = node.msg[i].origen[1];
    }
}

function onFrame(event) {
    cycle_elapsed = false;
    var d = new Date();
    if ((d.getTime() - lastTick) > cycleTime) {
      /* Even though we use time to measure cycles, we wait until all the messages get to destination.
      *  In a real gossip implementation this would't happen but it makes easier the understanding.*/
      still_working = [];
      switch (state) {
        case SEND_TEST_MESSAGE:
            still_working = selectedNodes.filter(function (node) {
              return (node.paths.filter(
                function (e) {
                  return e.is_destination;})).length > 0;
            });
          break;
        case PLAY:
            still_working = nodes.filter(function (node) {
              return (node.paths.filter(
                function (e) {
                  return e.is_destination;})).length > 0;
            });
          break;
      }
      if (still_working.length == 0) {
        lastTick = d.getTime();
        cycle_elapsed = true;
      }
    }
    gossip = false;
    nodes_in_play = undefined;
    switch (state) {
      case PLAY:
        if (activeNodes.length == nodes.length) return;
        nodes_in_play = nodes;
        gossip = true;
        break;
      case SEND_TEST_MESSAGE:
        if (selectedNodes.length <= 0) return;
        nodes_in_play = selectedNodes.slice();
        gossip = true;
        break;
    }
    if (gossip) {
        for (node in nodes_in_play) {
          selectedNode = nodes_in_play[node];
          selectedNode.rotate(0.5);
          data = selectedNode.dashArray;
          selectedNode.dashArray = [data[0], data[1]-0.03]; //0.03
          if (cycle_elapsed){
              selectedNode.dashArray = [10, 4];
              if (activeNodes.indexOf(selectedNode) > -1) {
                  prepareFanout(selectedNode);
                  selectFanout(selectedNode);
              }
          } else {
            sendingMsg(selectedNode);
          }
        }
        if (cycle_elapsed) {
              cycle.rotate(30);
              cycle_counter += 1;
              cycle.content = "Cycle N. " + cycle_counter;
        }
    }
}

