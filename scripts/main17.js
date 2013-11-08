// http://bl.ocks.org/mbostock/929623 shows a nice way to build a graph with intuitive controls.
// bl.ocks.org/rkirsling/5001347
// blueprints and rexster https://github.com/tinkerpop/blueprints/wiki
// context menu: http://joewalnes.com/2011/07/22/a-simple-good-looking-context-menu-for-jquery/
// context menu: https://github.com/arnklint/jquery-contextMenu
var htmlUri = 'http://www.w3.org/1999/xhtml';
var svgNamespaceUri = 'http://www.w3.org/2000/svg';
var xlinkUri = 'http://www.w3.org/1999/xlink';

var macromoleculeTypes = ['macromolecule', 'protein', 'gene', 'mrna', 'mirna', 'shrna', 'dna', 'transcription factor'];
var nucleicAcidFeatureTypes = ['nucleic acid feature', 'promoter'];
var unspecifiedEntityTypes = ['unspecified entity', 'family', 'abstract'];
var simpleChemicalTypes = ['simple chemical', 'small molecule'];
var perturbingAgentTypes = ['perturbing agent'];
var complexTypes = ['complex'];

var selectableEntityTypes = ['unspecified entity', 'protein', 'gene', 'mRNA', 'miRNA', 'nucleic acid feature', 'small molecule', 'perturbing agent', 'complex'];

var edgeTypeOptions = ['stop adding edges', 'positive regulation', 'negative regulation', 'activate transcription', 'inhibit transcription', 'component of', 'member of'];
var edgeTypeSymbols = ['stop adding edges', '-a>', '-a|', '-t>', '-t|', 'component>', 'member>'];

var throbberUrl = 'images/loading_16.gif';

// vars for d3.layout.force
var linkDistance = 120;
var linkStrength = 0.2;
var friction = 0.8;
var charge = -500;
var gravity = 0.01;

var nodeRadius = 20;
var graphDataURL = "data/test_pid";
graphDataURL = 'data/biopaxpid_75288_rdf_pid';
graphDataURL = 'data/biopaxpid_96010_xgmml_fix_pid';
graphDataURL = 'data/pid_erg_small_pathway_v2_pid';
graphDataURL = 'data/RB1_v5_pid';

var graph = new graphData();

var clickedNodesArray = new Array();

// $("input[type=button]").button();

// TODO dialogBox is a div
var pathwayDialogBox = d3.select('body').append('div').attr({
    id : 'pathwayDialog',
    title : ''
}).style({
    display : 'none'
}).append('textarea').attr({
    id : 'pathwayTextArea',
    'readonly' : 'readonly'
});

var elementDialogBox = d3.select('body').append('div').attr({
    id : 'elementDialog',
    title : ''
}).style({
    display : 'none'
});

var addNodeDialogBox = d3.select('body').append('div').attr({
    id : 'addNodeDialog',
    title : ''
}).style({
    display : 'none'
});

var addEdgeDialogBox = d3.select('body').append('div').attr({
    id : 'addEdgeDialog',
    title : ''
}).style({
    display : 'none'
});

// TODO svg element that contains the graph

var svg = d3.select("body").append("svg").attr({
    'width' : '100%',
    'height' : '100%',
    'id' : 'circleMaps'
});

var svg_defs = svg.append('defs');

svg_defs.append('marker').attr({
    'id' : 'arrowhead_marker',
    'refX' : 5,
    'refY' : 2,
    'markerWidth' : 5,
    'markerHeight' : 5,
    'orient' : 'auto'
}).append('path').attr({
    'd' : 'M 0 0 V 4 L5 2 Z'
});

svg_defs.append('marker').attr({
    'id' : 'bar_marker',
    'viewBox' : '-5 -5 10 10',
    'refX' : 0,
    'refY' : 0,
    'markerWidth' : 5,
    'markerHeight' : 5,
    'orient' : 'auto',
    'stroke' : 'black',
    'stroke-width' : 3
}).append('path').attr({
    'd' : 'M 0 -5 L 0 5 '
});

var bbox = document.getElementById('circleMaps').getBBox();
// var svgWidth = bbox.width / 2, svgHeight = bbox.height / 2;
console.log('bbox: ' + JSON.stringify(bbox));
var svgWidth = $(window).width(), svgHeight = $(window).height();

// TODO context menu on svg area

function showPathwayDialog() {
    var dialog = $("#pathwayDialog");

    dialog.attr({
        'style' : 'font-size: 10px'
    });
    $('#pathwayTextArea').attr({
        'style' : 'width:100% ; height:20em'
    });
    $('#pathwayTextArea').text(graph.toPid());
    dialog.dialog({
        'title' : 'pathway file',
        buttons : {
            "close" : function() {
                $(this).dialog("close");
                // }, //this just closes it - doesn't clean it up!!
                // "destroy" : function() {
                // $(this).dialog("destroy");
                // //this completely empties the dialog
                // //and returns it to its initial state
            }
        }
    });
}

$(function() {

    $('#circleMaps').contextPopup({
        title : '',
        items : [{
            // addNodeDialog
            label : 'new node',
            // icon : 'icons/shopping-basket.png',
            action : function() {
                console.log('clicked new node');
                showAddNodeDialogBox(graph);
            }
        }, {
            // addEdge
            label : 'new edge',
            // icon : 'icons/shopping-basket.png',
            action : function() {
                console.log('clicked new edge');
                showAddEdgeDialogBox(graph);
            }
        }, null, // divider
        {
            label : 'export to UCSC pathway format',
            // icon : 'icons/application-monitor.png',
            action : function() {
                console.log('clicked export to UCSC pathway format');
                showPathwayDialog();
                // var pidString = graph.toPid();
                // alert(pidString);
            }
        }]
    });

});

// svg.on("contextmenu", function(d, i) {
// d3.event.preventDefault();
// d3.event.stopPropagation();
// var position = d3.mouse(this);
//
// console.log('right click on blank svg');
// });

// for zoom/pan
// var svg = d3.select("body").append("svg").attr({
// 'width' : svgWidth,
// 'height' : svgHeight,
// 'id' : 'circleMaps'
// }).append('g').call(d3.behavior.zoom().scaleExtent([0.2, 8]).on("zoom", zoom)).append('g');
//
// svg.append("rect").attr("class", "overlay").attr("width", svgWidth).attr("height", svgHeight);
//
// function zoom() {
// var tr = d3.event.translate;
// var scale = d3.event.scale;
// console.log('zooming\ttranslate: ' + tr + '\tscale: ' + scale);
// svg.attr("transform", "translate(" + tr + ")scale(" + scale + ")");
// }

svg.append('g').attr({
    id : 'linkLayer'
});
svg.append('g').attr({
    id : 'nodeLayer'
});

// for d3 color mapping.
var colorMapper = d3.scale.category20();

// for d3 layout and rendering
var force = d3.layout.force().size([svgWidth, svgHeight]).linkDistance(linkDistance).linkStrength(linkStrength).friction(friction).gravity(gravity);

//TODO setup controls

var form = d3.select("body").append("form").style({
    display : 'none',
    'id' : 'mainForm'
});

var currentNodesListBox = form.append('select').attr({
    id : 'currentNodesListBox',
    name : 'currentNodesListBox',
    'class' : 'deleteControl'
}).on('change', function() {
    console.log('change');
}).style({
    display : 'none'
});

var currentEdgesListBox = form.append('select').attr({
    id : 'currentEdgesListBox',
    name : 'currentEdgesListBox',
    'class' : 'deleteControl'
}).on('change', function() {
    console.log('change');
});

var newNodeNameTextBox = form.append("input").attr({
    id : "newNodeNameTextBox",
    type : "text",
    value : "name of new node",
    name : "newNodeNameTextBox",
    title : 'name of new node',
    'class' : 'addControl'
}).on('keypress', function() {
    // http://stackoverflow.com/questions/15261447/how-do-i-capture-keystroke-events-in-d3-js
    console.log('keypress');
    var keyCode = d3.event.keyCode;
    if (keyCode == 13) {
        // prevent page from reloading on return key (13)
        d3.event.preventDefault();
    }
});

var newNodeTypeListBox = form.append('select').attr({
    id : 'newNodeTypeListBox',
    name : 'newNodeTypeListBox',
    'class' : 'addControl'
}).on('change', function() {
    console.log('change');
});

var newNodeButton = form.append("input").attr({
    id : "addNodeButton",
    type : "button",
    value : "add a new node",
    name : "addNodeButton",
    'class' : 'addControl'
});

var exportToUcscFormatButton = form.append("input").attr({
    id : "exportToUcscFormatButton",
    type : "button",
    value : "export to UCSC pathway format",
    name : "exportToUcscFormatButton",
    'class' : 'displayControl'
});

var addRandomNodeButton = form.append("input").attr({
    id : "addRandomNodeButton",
    type : "button",
    value : "add random node",
    name : "addRandomNodeButton",
    'class' : 'addControl'
});

var addRandomConnectedNodeButton = form.append("input").attr({
    id : "addConnectedButton",
    type : "button",
    value : "add random connected node",
    name : "addConnectedButton",
    'class' : 'addControl'
});

var addEdgeForm = d3.select("body").append("form").style({
    display : 'none'
}).attr({
    'id' : 'addEdgeForm'
});
{// setup node selection mode controls
    addEdgeForm.append('p').text('edge type:');

    // TODO build select box for edge type
    addEdgeForm.append('select').attr({
        'id' : 'edgeTypeSelect'
    }).on('change', function() {
        var newEdgeType = document.getElementById('edgeTypeSelect').value;
        if (newEdgeType == edgeTypeOptions[0]) {
            clickedNodesArray.length = 0;
            resetNewEdgeDialog();
        }
        console.log('selected edge type: ' + newEdgeType);
    });
    for (var i in edgeTypeOptions) {
        var edgeTypeOption = edgeTypeOptions[i];
        var edgeTypeSymbol = edgeTypeSymbols[i];
        d3.select('#edgeTypeSelect').append('option').attr({
            'value' : edgeTypeSymbol
        }).text(edgeTypeOption);
    }

    addEdgeForm.append('br');

    var clickedNodesDiv = addEdgeForm.append('div').attr({
        id : 'clickedNodesDiv'
    });

    clickedNodesDiv.append('label').text('source');
    clickedNodesDiv.append('textarea').attr({
        'id' : 'sourceTextArea',
        'readonly' : 'readonly'
    });
    clickedNodesDiv.append('br');
    clickedNodesDiv.append('label').text('target');
    clickedNodesDiv.append('textarea').attr({
        'id' : 'targetTextArea',
        'readonly' : 'readonly'
    });
    clickedNodesDiv.append('br');

    // TODO add edge button
    clickedNodesDiv.append("input").attr({
        id : "addEdgeButton",
        type : "button",
        value : "add new edge",
        name : "addEdgeButton",
        'class' : 'addControl',
        'disabled' : 'disabled'
    }).on('click', function() {
        var sourceIdx = clickedNodesArray[0];
        var targetIdx = clickedNodesArray[1];
        var relation = document.getElementById('edgeTypeSelect').value;
        console.log(sourceIdx + ' ' + relation + ' ' + targetIdx);

        if ((sourceIdx != targetIdx) && (relation != edgeTypeOptions[0]) && (clickedNodesArray.slice(-2).length == 2)) {
            graph.addLink(new linkData({
                'sourceIdx' : sourceIdx,
                'targetIdx' : targetIdx,
                'relation' : relation
            }));
            clearClickedNodes();
            resetNewEdgeDialog();
            updateToCurrentGraphData(svg, force, graph);
        }

    });
}

var showAddEdgeDialogBox = function(graph) {
    var dialog = $("#addEdgeDialog");
    dialog.removeAttr('title');
    dialog.attr({
        'style' : 'font-size: smaller'
    });
    dialog.dialog({
        'title' : 'new edge'
    });
    $('#addEdgeForm').appendTo(dialog).attr({
        'style' : 'display:inline'
    });
};

var showAddNodeDialogBox = function(graph) {
    var dialog = $("#addNodeDialog");
    dialog.removeAttr('title');
    $("#newNodeNameTextBox").appendTo(dialog).attr({
        'style' : 'display:inline'
    });
    $('#newNodeTypeListBox').appendTo(dialog).attr({
        'style' : 'display:inline'
    });
    $('#addNodeButton').appendTo(dialog).attr({
        'style' : 'display:inline'
    });
    dialog.attr({
        'style' : 'font-size: smaller'
    });
    dialog.dialog({
        'title' : 'new node'
    });
};

var showElementDialogBox = function(type, graph, index) {
    var dialog = $("#elementDialog");
    dialog.removeAttr('title');
    dialog.empty();
    if (type.toUpperCase() === 'EDGE') {
        var data = graph.links[index];
        dialog.append('p').attr({
            'style' : 'font-size: smaller'
        }).text(data.source.name + ' ' + data.relation + ' ' + data.target.name);
        dialog.dialog({
            'title' : type,
            buttons : {
                "delete" : function() {
                    // delete edge
                    graph.deleteLinkByIndex(index);
                    updateToCurrentGraphData(svg, force, graph);
                    $(this).dialog("close");
                },
                "close" : function() {
                    $(this).dialog("close");
                    // }, //this just closes it - doesn't clean it up!!
                    // "destroy" : function() {
                    // $(this).dialog("destroy");
                    // //this completely empties the dialog
                    // //and returns it to its initial state
                }
            }
        });
    } else if (type.toUpperCase() === 'NODE') {
        var data = graph.nodes[index];
        dialog.append('p').attr({
            'style' : 'font-size: smaller'
        }).text(data.name + ': ' + data.group);
        dialog.dialog({
            'title' : type,
            buttons : {
                "delete" : function() {
                    // delete node
                    graph.deleteNodeByName(data.name);
                    updateToCurrentGraphData(svg, force, graph);
                    $(this).dialog("close");
                },
                "close" : function() {
                    $(this).dialog("close");
                    // }, //this just closes it - doesn't clean it up!!
                    // "destroy" : function() {
                    // $(this).dialog("destroy");
                    // //this completely empties the dialog
                    // //and returns it to its initial state
                }
            }
        });
    }
};

var testButton = form.append('input').attr({
    id : 'testButton',
    type : 'button',
    value : 'testButton',
    name : 'testButton',
    'class' : 'displayControl',
    title : 'test'
}).on('click', function() {
    // $(showDialogBox('my title', 'my text'));
    // closeDialogBox();
    //d3.select('#pathwayTextArea').text('text from testButton');
    //$('#pathwayTextArea').val('text from the testButton');
    console.log('mode:' + getNodeClickMode());
});

/**
 * get the node click mode, which is selected from the possible types of edges to create
 */
function getNodeClickMode() {
    var mode = 'none';
    var edgeTypeValue = document.getElementById('edgeTypeSelect').value;
    if (edgeTypeValue != null) {
        mode = edgeTypeValue;
    }
    return mode;
}

// TODO draw graph

function throbberOn() {
    svg.append('image').attr({
        id : 'throbber',
        'xlink:href' : throbberUrl,
        x : (0.5 * svgWidth),
        y : (0.5 * svgHeight),
        'width' : 16,
        'height' : 16
    });
}

function throbberOff() {
    d3.select('#throbber').remove();
}

// network
d3.text(graphDataURL, function(error, data) {
    if (error !== null) {
        console.log("error getting graph data --> " + error);
    }

    // var graph = new graphData();
    if (endsWith(graphDataURL.toUpperCase(), 'PID')) {
        graph.readPid(data);
    } else if (endsWith(graphDataURL.toUpperCase(), 'SIF')) {
        graph.readSif(data);
    } else {
        graph.readTab(data);
    }

    // TODO render graph
    updateToCurrentGraphData(svg, force, graph);

    // entity types listbox
    newNodeTypeListBox.each(function(d, i) {
        for (var i in selectableEntityTypes) {
            var entityType = selectableEntityTypes[i];
            var optionElement = document.createElementNS(htmlUri, 'option');
            optionElement.setAttributeNS(null, 'value', entityType);
            optionElement.innerHTML = entityType;

            this.appendChild(optionElement);
        }
    });

    // new node button
    newNodeButton.on("click", function() {
        id = this.getAttribute("id");
        value = this.getAttribute("value");

        var name = document.getElementById('newNodeNameTextBox').value;

        // get the group
        groups = getListBoxSelectedValues(document.getElementById('newNodeTypeListBox'));
        graph.addNode(new nodeData({
            'name' : name,
            'group' : groups[0]
        }));

        updateToCurrentGraphData(svg, force, graph);
    });

    if (getQueryStringParameterByName('test').toLowerCase() == 'true') {
        form.style({
            display : 'inline'
        });

        currentNodesListBox.style({
            display : 'inline'
        });

        currentEdgesListBox.style({
            display : 'inline'
        });

        addRandomNodeButton.style({
            display : 'inline'
        }).on("click", function() {
            id = this.getAttribute("id");
            value = this.getAttribute("value");

            group = Math.floor(Math.random() * 20);
            graph.addNode(new nodeData({
                name : Math.random().toString(),
                'group' : group
            }));

            updateToCurrentGraphData(svg, force, graph);
        });

        addRandomConnectedNodeButton.style({
            display : 'inline'
        }).on("click", function() {
            id = this.getAttribute("id");
            value = this.getAttribute("value");

            group = Math.floor(Math.random() * 20);
            graph.addNode(new nodeData({
                name : Math.random().toString(),
                'group' : group
            }));

            sourceIdx = graph.nodes.length - 1;
            targetIdx = Math.floor(Math.random() * graph.nodes.length);

            if (sourceIdx != targetIdx) {
                graph.addLink(new linkData({
                    'sourceIdx' : sourceIdx,
                    'targetIdx' : targetIdx
                }));
            }

            updateToCurrentGraphData(svg, force, graph);
        });

        // graph as PID button
        exportToUcscFormatButton.on("click", function() {
            id = this.getAttribute("id");
            value = this.getAttribute("value");

            var pidString = graph.toPid();

            alert(pidString);
        }).style({
            display : 'inline'
        });

        testButton.style({
            display : 'inline'
        });
    }
});

// TODO instance methods

// requires svg, force, graph, cmg, circleDataLoaded, and various constants
function renderGraph(svg, force, graph) {"use strict";

    var opacityVal = 0.6;
    var largeScale = 'scale(2)';
    var smallScale = 'scale(0.2)';

    // clear the current graph
    var removedLinks = svg.selectAll(".link").remove();
    var removedNodes = svg.selectAll(".node").remove();

    if (graph.nodes.length < 1) {
        return;
    }

    // reset circleMapSvg class elements by creating circleMap elements for each query feature.
    var svgNodeLayer = svg.select('#nodeLayer').attr({
        //  'opacity' : 0
    });
    var nodeNames = graph.getAllNodeNames();

    // start the layout
    force.nodes(graph.nodes).links(graph.links).start();

    // links
    var svgLinkLayer = svg.select('#linkLayer');
    var linkSelection = svgLinkLayer.selectAll(".link").data(graph.links).enter().append("line").attr('id', function(d, i) {
        return 'link' + i;
    }).attr({
        'class' : "link",
        'opacity' : opacityVal,
        'marker-start' : null,
        'marker-mid' : null,
        'marker-end' : 'url(#arrowhead_marker)'
    }).style("stroke", function(d) {
        return colorMapper(d.relation);
    });

    linkSelection.style("stroke-width", function(d) {
        return d.value;
    });

    // mouse events for links - thicken on mouseover
    linkSelection.on('mouseover', function(d, i) {
        // mouseover event for link
        var linkElement = document.getElementById('link' + i);
        linkElement.setAttributeNS(null, 'style', 'stroke-width:' + (d.value * 3) + ' ; stroke:' + colorMapper(d.relation));
    }).on('mouseout', function(d, i) {
        // mouseout event for link
        var linkElement = document.getElementById('link' + i);
        linkElement.setAttributeNS(null, 'style', 'stroke-width:' + d.value + ' ; stroke:' + colorMapper(d.relation));
    });

    // context menu for link
    linkSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        var linkDesc = d.source.name + ' ' + d.relation + ' ' + d.target.name;
        console.log('right click on link: ' + linkDesc + '(' + i + ')');

        $(showElementDialogBox('edge', graph, i));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // nodes
    var nodeSelection = svgNodeLayer.selectAll(".node").data(graph.nodes).enter().append("g").attr('class', function(d, i) {
        return "node " + d.name + ' ' + d.group;
    });

    // mouse events for sbgn nodes
    nodeSelection.on('mouseover', function(d, i) {
        // mouseover event for node
        var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
        var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
        nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:4;fill:' + colorMapper(d.group));
    }).on('mouseout', function(d, i) {
        // mouseout event for node
        var nodeElement = document.getElementsByClassName("node " + d.name + ' ' + d.group);
        var nodeSbgnElement = nodeElement[0].getElementsByClassName('sbgn');
        nodeSbgnElement[0].setAttributeNS(null, 'style', 'stroke-width:1;fill:' + colorMapper(d.group));
    });

    nodeSelection.call(force.drag);

    // context menu for node
    nodeSelection.on("contextmenu", function(d, i) {
        var position = d3.mouse(this);
        console.log('right click on node: ' + d.name + '(' + i + ')');

        $(showElementDialogBox('node', graph, i));

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // TODO node click
    nodeSelection.on("click", function(d, i) {
        var position = d3.mouse(this);
        console.log('left click on node: ' + d.name + '(' + i + ')');

        var nodeClickMode = getNodeClickMode();

        console.log('click mode: ' + nodeClickMode);

        if (nodeClickMode == 'none' || nodeClickMode == edgeTypeOptions[0]) {
            console.log('ignore click event');
        } else {
            addClickedNodeToList(i);
            for (var i in clickedNodesArray) {
                var idx = clickedNodesArray[i];
                console.log(idx);
            }

            updateNewEdgeDialog();
        }

        d3.event.preventDefault();
        d3.event.stopPropagation();
    });

    // node visualization
    nodeSelection.append(function(d) {
        var nodeName = d['name'];
        var type = d.group.toString().toLowerCase();
        if (nucleicAcidFeatureTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            newElement.setAttributeNS(null, 'class', 'sbgn');
            var path = bottomRoundedRectPath(-20, -15, 40, 30, 10);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            newElement.setAttributeNS(null, 'stroke', 'black');
            return newElement;
        } else if (macromoleculeTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            newElement.setAttributeNS(null, 'class', 'sbgn');
            var path = allRoundedRectPath(-20, -15, 40, 30, 10);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            newElement.setAttributeNS(null, 'stroke', 'black');
            return newElement;
        } else if (simpleChemicalTypes.indexOf(type) != -1) {
            // circle
            var newElement = document.createElementNS(svgNamespaceUri, 'circle');
            newElement.setAttributeNS(null, 'class', 'sbgn');
            newElement.setAttributeNS(null, 'r', nodeRadius);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            newElement.setAttributeNS(null, 'stroke', 'black');
            return newElement;
        } else if (complexTypes.indexOf(type) != -1) {
            var newElement = document.createElementNS(svgNamespaceUri, 'path');
            newElement.setAttributeNS(null, 'class', 'sbgn');
            var path = allAngledRectPath(-50, -30, 100, 60);
            newElement.setAttributeNS(null, 'd', path);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            newElement.setAttributeNS(null, 'stroke', 'black');
            return newElement;
        } else {
            // unspecified entity
            var newElement = document.createElementNS(svgNamespaceUri, 'ellipse');
            newElement.setAttributeNS(null, 'class', 'sbgn');
            newElement.setAttributeNS(null, 'cx', 0);
            newElement.setAttributeNS(null, 'cy', 0);
            newElement.setAttributeNS(null, 'rx', 1.5 * nodeRadius);
            newElement.setAttributeNS(null, 'ry', 0.75 * nodeRadius);
            newElement.setAttributeNS(null, 'opacity', opacityVal);
            newElement.setAttributeNS(null, 'stroke', 'black');
            return newElement;
        }
    }).style("fill", function(d) {
        return colorMapper(d.group);
    });

    nodeSelection.append("svg:text").attr("text-anchor", "middle").attr('dy', ".35em").text(function(d) {
        return d.name;
    });

    // edge tooltips
    linkSelection.append("title").text(function(d) {
        var label = d.source.name + " " + d.relation + " " + d.target.name;
        return label;
    });

    // node tooltips
    nodeSelection.append("title").text(function(d) {
        return d.name + ' : ' + d.group;
    });

    // tick handler repositions graph elements
    force.on("tick", function() {
        linkSelection.attr("x1", function(d) {
            return d.source.x;
        }).attr("y1", function(d) {
            return d.source.y;
        }).attr("x2", function(d) {
            return d.target.x;
        }).attr("y2", function(d) {
            return d.target.y;
        });

        nodeSelection.attr("transform", function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        });
    });
}

/**
 *
 * @param {Object} currentGraphData
 */
function updateCurrentNodesListBox(currentGraphData) {
    var currentNodesListBox = document.getElementById('currentNodesListBox');

    // clear options starting from the bottom of the listbox
    var optionElements = currentNodesListBox.getElementsByTagName('option');
    for (var i = optionElements.length - 1; optionElements.length > 0; i--) {
        var optionElement = optionElements[i];
        optionElement.parentNode.removeChild(optionElement);
    }

    // add options
    for (var i in currentGraphData['nodes']) {
        var nodeData = currentGraphData['nodes'][i];
        var nodeName = nodeData['name'];
        var optionElement = document.createElementNS(htmlUri, 'option');
        optionElement.setAttributeNS(null, 'value', nodeName);
        optionElement.innerHTML = nodeName;

        currentNodesListBox.appendChild(optionElement);
    }
}

/**
 *
 * @param {Object} currentGraphData
 */
function updateCurrentEdgesListBox(currentGraphData) {
    var listbox = document.getElementById('currentEdgesListBox');

    // clear options starting from the bottom of the listbox
    var optionElements = listbox.getElementsByTagName('option');
    for (var i = optionElements.length - 1; optionElements.length > 0; i--) {
        var optionElement = optionElements[i];
        optionElement.parentNode.removeChild(optionElement);
    }

    // add options
    for (var i in currentGraphData['links']) {
        var linkData = currentGraphData['links'][i];
        var sourceNode = linkData['source'];
        var targetNode = linkData['target'];
        var relation = linkData['relation'];

        var value = sourceNode['name'] + ' ' + relation + ' ' + targetNode['name'];

        var optionElement = document.createElementNS(htmlUri, 'option');
        optionElement.setAttributeNS(null, 'value', i);
        optionElement.innerHTML = value;

        listbox.appendChild(optionElement);
    }
}

/**
 * Clear the text from the text areas in the new edge dialog box.
 */
function resetNewEdgeDialog() {
    d3.select('#clickedNodesDiv').select('#sourceTextArea').text('');
    d3.select('#clickedNodesDiv').select('#targetTextArea').text('');
    d3.select('#addEdgeButton').attr({
        'disabled' : 'disabled'
    });
}

/**
 * fill in the text area with source node and target node for new edge.
 */
function updateNewEdgeDialog() {
    var slice = clickedNodesArray.slice(-2);
    for (var i in slice) {
        var nodeData = graph['nodes'][slice[i]];
        var newText = nodeData.name + ': ' + nodeData.group;
        var textAreaId = (i == 0) ? 'sourceTextArea' : 'targetTextArea';
        d3.select('#clickedNodesDiv').select('#' + textAreaId).text(newText);
    }

    // make button (in)active
    if (slice.length == 2) {
        d3.select('#addEdgeButton').attr({
            'disabled' : null
        });
    } else {
        d3.select('#addEdgeButton').attr({
            'disabled' : 'disabled'
        });
    }
}

/**
 * clear the clickedNodesArray
 */
function clearClickedNodes() {
    clickedNodesArray = new Array();
}

/**
 * add specified index to clicked nodes array.  Keeps only last 2 items.
 */
function addClickedNodeToList(nodeIdx) {
    // check if node already exists
    var exists = false;
    for (var i in clickedNodesArray) {
        var idx = clickedNodesArray[i];
        if (idx === nodeIdx) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        // add node
        clickedNodesArray.push(nodeIdx);

        // trim array to maximum 2 elements
        if (clickedNodesArray.length > 2) {
            // keep only last 2 elements
            clickedNodesArray = clickedNodesArray.slice(-2);
        }
    }
    return clickedNodesArray;
}

/**
 * remove specified index from clicked nodes array
 */
function removeClickedNode(nodeIdx) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && clickedNodesArray.length) {
        what = a[--L];
        while (( ax = clickedNodesArray.indexOf(what)) !== -1) {
            clickedNodesArray.splice(ax, 1);
        }
    }
    return clickedNodesArray;
}

/**
 * Update to current graphData:
 * <ul>
 * <li>graph rendering</li>
 * <li>currentNodesListBox</li>
 * <li>currentEdgesListBox</li>
 * </ul>
 */
function updateToCurrentGraphData(svgElement, d3Force, currentGraphData) {
    clearClickedNodes();
    renderGraph(svgElement, d3Force, currentGraphData);
    updateCurrentNodesListBox(currentGraphData);
    updateCurrentEdgesListBox(currentGraphData);
    d3.select('#pathwayTextArea').text(currentGraphData.toPid());
}

// TODO static methods

/**
 * Check if str ends with suffix.
 * @param {Object} str
 * @param {Object} suffix
 */
function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * get the selected values of a list box control.
 */
function getListBoxSelectedValues(listboxElement) {
    var selectedValues = new Array();
    for (var i = 0; i < listboxElement.length; i++) {
        var option = listboxElement[i];
        if (option.selected) {
            selectedValues.push(option.value);
        }
    }
    return selectedValues;
}

/**
 * Returns path data for a rectangle with rounded bottom corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 * @param {Object} radius
 */
function bottomRoundedRectPath(x, y, width, height, radius) {
    var pathString = '';
    pathString += "M" + x + "," + y;
    pathString += "h" + (width);
    pathString += "v" + (height - radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (radius);
    pathString += "h" + (-1 * (width - 2 * radius));
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (-1 * radius);
    pathString += "v" + (-1 * (height - radius));
    pathString += 'z';
    return pathString;
}

/**
 * Returns path data for a rectangle with all rounded corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 * @param {Object} radius
 */
function allRoundedRectPath(x, y, width, height, radius) {
    var pathString = '';
    pathString += "M" + (x) + "," + (y + radius);
    pathString += "a" + (radius) + "," + (radius) + " 0 0 1 " + (radius) + "," + (-1 * radius);
    pathString += "h" + (width - 2 * radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (radius) + "," + (radius);
    pathString += "v" + (height - 2 * radius);
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (radius);
    pathString += "h" + (-1 * (width - 2 * radius));
    pathString += "a" + radius + "," + radius + " 0 0 1 " + (-1 * radius) + "," + (-1 * radius);
    pathString += "v" + (-1 * (height - 2 * radius));
    pathString += 'z';
    return pathString;
}

/**
 * Returns path data for a rectangle with angled corners.
 * The top-left corner is (x,y).
 * @param {Object} x
 * @param {Object} y
 * @param {Object} width
 * @param {Object} height
 */
function allAngledRectPath(x, y, width, height) {
    // calculated from longer side
    var pad = (width > height) ? width / 8 : height / 8;
    var pathString = '';
    pathString += "M" + (x + pad) + "," + (y);
    pathString += "h" + (width - 2 * pad);
    pathString += 'l' + pad + ',' + pad;
    pathString += "v" + (height - 2 * pad);
    pathString += 'l' + (-1 * pad) + ',' + (pad);
    pathString += "h" + (-1 * (width - 2 * pad));
    pathString += 'l' + (-1 * pad) + ',' + (-1 * pad);
    pathString += "v" + (-1 * (height - 2 * pad));
    pathString += 'z';
    return pathString;
}

/**
 * Get the value of a parameter from the query string.  If parameter has not value or does not exist, return <code>null</code>.
 * From <a href='http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values'>here</a>.
 * @param {Object} name
 */
function getQueryStringParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    var results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}
