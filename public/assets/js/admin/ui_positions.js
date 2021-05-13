/*
 * ui_departments.js
 *
 * JavaScript used for /admin/departments/ page.
 */

"use strict";

$(document).ready(function(){
	
	$('#position_tree').tree({
	    autoOpen: true,
	    dragAndDrop: true,
	    closedIcon: $('<i class="icon-plus" style="padding-right: 5px;"></i>'),
	    openedIcon: $('<i class="icon-minus" style="padding-right: 5px;"></i>'),
	    onCreateLi: function(node, $li) {
            // Append a link to the jqtree-element div.
            // The link has an url '#node-[id]' and a data property 'node-id'.
            $li.addClass("dd-item");
            $li.children('div.jqtree-element').addClass("dd-handle");

            $li.find('.jqtree-element').append(
                '<a href="#node-'+ node.id +'" class="jqtree-item-edit" data-node-id="'+
                node.id +'">' + '<i class="icon-pencil"></i>编辑</a>'
            );
        }
	});

	$('#position_tree').bind(
	    'tree.init',
	    function(e) {
	        // initializing code set the style
	        console.log("tree initialized!", $(this));
	        $(this).children("ul").addClass("dd-list");
	    }
	);

	$("#employee_table").DataTable({
		ajax: '/admin/employees/list.json',
		columns: [
			{ data: "firstName" },
			{ data: 'lastName' },
			{ data: 'username', defaultContent: ''},
			{ data: 'status' }
		]
	});

	var currentNode = '';

	$('#position_tree').bind(
	    'tree.click',
	    function(event) {
	        // The clicked node is 'event.node'
	        var node = event.node;
	        currentNode = node.id;

	        console.log(node.id);
	        //Ajax call to get employees
	        var dt = $("#employee_table").DataTable();
	        dt.ajax.url( '/admin/employees/list.json?position=' + currentNode )
	        	.load(function(data){
	        		console.log(data);
	        	});

	  //       $.ajax({
	  //       	url: '/admin/employees/list.json?position=' + node.id,
	  //       	dataType: 'json'
	  //       }).done(function(data, textStatus, jqXHR){
   //      		console.log(data);
        		
   //      	})
	  //       .fail(function(jqXHR, textStatus, errorThrown) {
			// 	console.log( "error" + errorThrown );
			// });
	    }
	);

	$("#btn_employee_add").click(function(e){
		//Add employee to current position
		if(!currentNode) return; //currentNode not set, do nothing;

		$.ajax({
			url: '/admin/employees/',
			method: 'POST',
			data: {
				position: currentNode,
				username: 'wjj',
				lastName: '王',
				firstName: '佳骏'
			}
		}).done(function(data, textStatus, jqXHR){
			console.log(data);
		}).fail(function(jqXHR, textStatus, errorThrown){
			console.log(errorThrown);
		});

	});


});