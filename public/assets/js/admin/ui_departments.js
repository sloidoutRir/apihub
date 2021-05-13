/*
 * ui_departments.js
 *
 * JavaScript used for /admin/departments/ page.
 */

"use strict";

$(document).ready(function(){
	
	$('#department_tree').tree({
	    autoOpen: false,
	    dragAndDrop: false,
	    closedIcon: '+',
	    openedIcon: '-',
	    onCreateLi: function(node, $li) {
            // Append a link to the jqtree-element div.
            // The link has an url '#node-[id]' and a data property 'node-id'.
            $li.addClass("dd-item");
            $li.children('div.jqtree-element').addClass("dd-handle");
        }
	});

	$('#department_tree').bind(
	    'tree.init',
	    function(e) {
	        // initializing code set the style
	        console.log($(this));
	        $(this).children("ul").addClass("dd-list");
	    }
	);

	$('#position_tree').tree();

	$('#department_tree').bind(
	    'tree.click',
	    function(event) {
	        // The clicked node is 'event.node'
	        var node = event.node;
	        var name = node.name;
	        //Ajax call to get positions
	        $.ajax({
	        	url: '/admin/departments/positions.json?department=' + name,
	        	dataType: 'json'
	        }).done(function(data, textStatus, jqXHR){
        		console.log(data);
        		$('#position_tree').tree('loadData', data);
        	})
	        .fail(function(jqXHR, textStatus, errorThrown) {
				console.log( "error" + errorThrown );
			});
	    }
	);


});