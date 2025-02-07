/**
 * --------------------------------------------------------------------
 * jQuery-Plugin "visualize"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * Copyright (c) 2009 Filament Group 
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 * 	
 * --------------------------------------------------------------------
 */
(function($) { 
$.fn.visualize = function(options, container){
	return $(this).each(function(){
		//configuration
		let o = $.extend({
			type: 'bar', //also available: area, pie, line
			width: $(this).width(), //height of canvas - defaults to table height
			height: $(this).height(), //height of canvas - defaults to table height
			appendTitle: true, //table caption text is added to chart
			title: null, //grabs from table caption if null
			appendKey: true, //color key is added to chart
			colors: ['#666699','#92d5ea','#ee8310','#8d10ee','#5a3b16','#26a4ed','#f45a90','#e9e744','#FF0066','#FF66FF','#FF6633','#CC33CC','#9999FF','#CCCC99','#CCCCCC'],
			textColors: [], //corresponds with colors array. null/undefined items will fall back to CSS
			parseDirection: 'x', //which direction to parse the table data
			pieMargin: 20, //pie charts only - spacing around pie
			pieLabelPos: 'inside',
			lineWeight: 2, //for line and area - stroke weight
			barGroupMargin: 2,
			barMargin: 1, //space around bars in bar chart (added to both sides of bar)
			yLabelInterval: 30 //distance between y labels
		},options);
		
		//reset width, height to numbers
		o.width = parseFloat(o.width);
		o.height = parseFloat(o.height);
		
		
		let self = $(this);
		
		//function to scrape data from html table
		function scrapeTable(){
			let colors = o.colors;
			let textColors = o.textColors;
			let tableData = {
				dataGroups: function(){
					let dataGroups = [];
					if(o.parseDirection == 'x'){
						self.find('tr:gt(0)').each(function(i){
							dataGroups[i] = {};
							dataGroups[i].points = [];
							dataGroups[i].color = colors[i];
							if(textColors[i]){ dataGroups[i].textColor = textColors[i]; }
							$(this).find('td').each(function(){
								dataGroups[i].points.push( parseFloat($(this).text()) );
							});
						});
					}
					else {
						let cols = self.find('tr:eq(1) td').size();
						for(let i=0; i<cols; i++){
							dataGroups[i] = {};
							dataGroups[i].points = [];
							dataGroups[i].color = colors[i];
							if(textColors[i]){ dataGroups[i].textColor = textColors[i]; }
							self.find('tr:gt(0)').each(function(){
								dataGroups[i].points.push( $(this).find('td').eq(i).text()*1 );
							});
						};
					}
					return dataGroups;
				},
				allData: function(){
					let allData = [];
					$(this.dataGroups()).each(function(){
						allData.push(this.points);
					});
					return allData;
				},
				dataSum: function(){
					let dataSum = 0;
					let allData = this.allData().join(',').split(',');
					$(allData).each(function(){
						dataSum += parseFloat(this);
					});
					return dataSum
				},	
				topValue: function(){
						let topValue = 0;
						let allData = this.allData().join(',').split(',');
						$(allData).each(function(){
							if(parseFloat(this,10)>topValue) topValue = parseFloat(this);
						});
						return topValue;
				},
				bottomValue: function(){
						let bottomValue = 0;
						let allData = this.allData().join(',').split(',');
						$(allData).each(function(){
							if(this<bottomValue) bottomValue = parseFloat(this);
						});
						return bottomValue;
				},
				memberTotals: function(){
					let memberTotals = [];
					let dataGroups = this.dataGroups();
					$(dataGroups).each(function(l){
						let count = 0;
						$(dataGroups[l].points).each(function(m){
							count +=dataGroups[l].points[m];
						});
						memberTotals.push(count);
					});
					return memberTotals;
				},
				yTotals: function(){
					let yTotals = [];
					let dataGroups = this.dataGroups();
					let loopLength = this.xLabels().length;
					for(let i = 0; i<loopLength; i++){
						yTotals[i] =[];
						let thisTotal = 0;
						$(dataGroups).each(function(l){
							yTotals[i].push(this.points[i]);
						});
						yTotals[i].join(',').split(',');
						$(yTotals[i]).each(function(){
							thisTotal += parseFloat(this);
						});
						yTotals[i] = thisTotal;
						
					}
					return yTotals;
				},
				topYtotal: function(){
					let topYtotal = 0;
						let yTotals = this.yTotals().join(',').split(',');
						$(yTotals).each(function(){
							if(parseFloat(this,10)>topYtotal) topYtotal = parseFloat(this);
						});
						return topYtotal;
				},
				totalYRange: function(){
					return this.topValue() - this.bottomValue();
				},
				xLabels: function(){
					let xLabels = [];
					if(o.parseDirection == 'x'){
						self.find('tr:eq(0) th').each(function(){
							xLabels.push($(this).html());
						});
					}
					else {
						self.find('tr:gt(0) th').each(function(){
							xLabels.push($(this).html());
						});
					}
					return xLabels;
				},
				yLabels: function(){
					let yLabels = [];
					yLabels.push(bottomValue); 
					let numLabels = Math.round(o.height / o.yLabelInterval);
					let loopInterval = Math.ceil(totalYRange / numLabels) || 1;
					while( yLabels[yLabels.length-1] < topValue - loopInterval){
						yLabels.push(yLabels[yLabels.length-1] + loopInterval); 
					}
					yLabels.push(topValue); 
					return yLabels;
				}			
			};
			
			return tableData;
		};
		
		
		//function to create a chart
		let createChart = {
			pie: function(){	
				
				canvasContain.addClass('visualize-pie');
				
				if(o.pieLabelPos == 'outside'){ canvasContain.addClass('visualize-pie-outside'); }	
						
				let centerx = Math.round(canvas.width()/2);
				let centery = Math.round(canvas.height()/2);
				let radius = centery - o.pieMargin;				
				let counter = 0.0;
				let toRad = function(integer){ return (Math.PI/180)*integer; };
				let labels = $('<ul class="visualize-labels"></ul>')
					.insertAfter(canvas);

				//draw the pie pieces
				$.each(memberTotals, function(i){
					let fraction = (this <= 0 || isNaN(this))? 0 : this / dataSum;
					ctx.beginPath();
					ctx.moveTo(centerx, centery);
					ctx.arc(centerx, centery, radius, 
						counter * Math.PI * 2 - Math.PI * 0.5,
						(counter + fraction) * Math.PI * 2 - Math.PI * 0.5,
		                false);
			        ctx.lineTo(centerx, centery);
			        ctx.closePath();
			        ctx.fillStyle = dataGroups[i].color;
			        ctx.fill();
			        // draw labels
			       	let sliceMiddle = (counter + fraction/2);
			       	let distance = o.pieLabelPos == 'inside' ? radius/1.5 : radius +  radius / 5;
			        let labelx = Math.round(centerx + Math.sin(sliceMiddle * Math.PI * 2) * (distance));
			        let labely = Math.round(centery - Math.cos(sliceMiddle * Math.PI * 2) * (distance));
			        let leftRight = (labelx > centerx) ? 'right' : 'left';
			        let topBottom = (labely > centery) ? 'bottom' : 'top';
			        let labeltext = $('<span class="visualize-label">' + Math.round(fraction*100) + '%</span>')
			        	.css(leftRight, 0)
			        	.css(topBottom, 0);
			        let label = $('<li class="visualize-label-pos"></li>')
			       			.appendTo(labels)
			        		.css({left: labelx, top: labely})
			        		.append(labeltext);	
			        labeltext
			        	.css('font-size', radius / 8)		
			        	.css('margin-'+leftRight, -labeltext.width()/2)
			        	.css('margin-'+topBottom, -labeltext.outerHeight()/2);
			        	
			        if(dataGroups[i].textColor){ labeltext.css('color', dataGroups[i].textColor); }	
			      	counter+=fraction;
				});
			},
			
			line: function(area){
			
				if(area){ canvasContain.addClass('visualize-area'); }
				else{ canvasContain.addClass('visualize-line'); }
			
				//write X labels
				let xInterval = canvas.width() / (xLabels.length -1);
				let xlabelsUL = $('<ul class="visualize-labels-x"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(xLabels, function(i){ 
					let thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line" />')
						.css('left', xInterval * i)
						.appendTo(xlabelsUL);						
					let label = thisLi.find('span:not(.line)');
					let leftOffset = label.width()/-2;
					if(i == 0){ leftOffset = 0; }
					else if(i== xLabels.length-1){ leftOffset = -label.width(); }
					label
						.css('margin-left', leftOffset)
						.addClass('label');
				});

				//write Y labels
				let yScale = canvas.height() / totalYRange;
				let liBottom = canvas.height() / (yLabels.length-1);
				let ylabelsUL = $('<ul class="visualize-labels-y"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
					
				$.each(yLabels, function(i){  
					let thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line"  />')
						.css('bottom',liBottom*i)
						.prependTo(ylabelsUL);
					let label = thisLi.find('span:not(.line)');
					let topOffset = label.height()/-2;
					if(i == 0){ topOffset = -label.height(); }
					else if(i== yLabels.length-1){ topOffset = 0; }
					label
						.css('margin-top', topOffset)
						.addClass('label');
				});

				//start from the bottom left
				ctx.translate(0,zeroLoc);
				//iterate and draw
				$.each(dataGroups,function(h){
					ctx.beginPath();
					ctx.lineWidth = o.lineWeight;
					ctx.lineJoin = 'round';
					let points = this.points;
					let integer = 0;
					ctx.moveTo(0,-(points[0]*yScale));
					$.each(points, function(){
						ctx.lineTo(integer,-(this*yScale));
						integer+=xInterval;
					});
					ctx.strokeStyle = this.color;
					ctx.stroke();
					if(area){
						ctx.lineTo(integer,0);
						ctx.lineTo(0,0);
						ctx.closePath();
						ctx.fillStyle = this.color;
						ctx.globalAlpha = .3;
						ctx.fill();
						ctx.globalAlpha = 1.0;
					}
					else {ctx.closePath();}
				});
			},
			
			area: function(){
				createChart.line(true);
			},
			
			bar: function(){
				
				canvasContain.addClass('visualize-bar');
			
				//write X labels
				let xInterval = canvas.width() / (xLabels.length);
				let xlabelsUL = $('<ul class="visualize-labels-x"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(xLabels, function(i){ 
					let thisLi = $('<li><span class="label">'+this+'</span></li>')
						.prepend('<span class="line" />')
						.css('left', xInterval * i)
						.width(xInterval)
						.appendTo(xlabelsUL);
					let label = thisLi.find('span.label');
					label.addClass('label');
				});

				//write Y labels
				let yScale = canvas.height() / totalYRange;
				let liBottom = canvas.height() / (yLabels.length-1);
				let ylabelsUL = $('<ul class="visualize-labels-y"></ul>')
					.width(canvas.width())
					.height(canvas.height())
					.insertBefore(canvas);
				$.each(yLabels, function(i){  
					let thisLi = $('<li><span>'+this+'</span></li>')
						.prepend('<span class="line"  />')
						.css('bottom',liBottom*i)
						.prependTo(ylabelsUL);
						let label = thisLi.find('span:not(.line)');
						let topOffset = label.height()/-2;
						if(i == 0){ topOffset = -label.height(); }
						else if(i== yLabels.length-1){ topOffset = 0; }
						label
							.css('margin-top', topOffset)
							.addClass('label');
				});

				//start from the bottom left
				ctx.translate(0,zeroLoc);
				//iterate and draw
				for(let h=0; h<dataGroups.length; h++){
					ctx.beginPath();
					let linewidth = (xInterval-o.barGroupMargin*2) / dataGroups.length; //removed +1 
					let strokeWidth = linewidth - (o.barMargin*2);
					ctx.lineWidth = strokeWidth;
					let points = dataGroups[h].points;
					let integer = 0;
					for(let i=0; i<points.length; i++){
						let xVal = (integer-o.barGroupMargin)+(h*linewidth)+linewidth/2;
						xVal += o.barGroupMargin*2;
						
						ctx.moveTo(xVal, 0);
						ctx.lineTo(xVal, Math.round(-points[i]*yScale));
						integer+=xInterval;
					}
					ctx.strokeStyle = dataGroups[h].color;
					ctx.stroke();
					ctx.closePath();
				}
			}
		};
	
		//create new canvas, set w&h attrs (not inline styles)
		let canvasNode = document.createElement("canvas"); 
		canvasNode.setAttribute('height',o.height);
		canvasNode.setAttribute('width',o.width);
		let canvas = $(canvasNode);
			
		//get title for chart
		let title = o.title || self.find('caption').text();
		
		//create canvas wrapper div, set inline w&h, append
		let canvasContain = (container || $('<div class="visualize" role="img" aria-label="Chart representing data from the table: '+ title +'" />'))
			.height(o.height)
			.width(o.width)
			.append(canvas);

		//scrape table (this should be cleaned up into an obj)
		let tableData = scrapeTable();
		let dataGroups = tableData.dataGroups();
		let allData = tableData.allData();
		let dataSum = tableData.dataSum();
		let topValue = tableData.topValue();
		let bottomValue = tableData.bottomValue();
		let memberTotals = tableData.memberTotals();
		let totalYRange = tableData.totalYRange();
		let zeroLoc = o.height * (topValue/totalYRange);
		let xLabels = tableData.xLabels();
		let yLabels = tableData.yLabels();
								
		//title/key container
		if(o.appendTitle || o.appendKey){
			let infoContain = $('<div class="visualize-info"></div>')
				.appendTo(canvasContain);
		}
		
		//append title
		if(o.appendTitle){
			$('<div class="visualize-title">'+ title +'</div>').appendTo(infoContain);
		}
		
		
		//append key
		if(o.appendKey){
			let newKey = $('<ul class="visualize-key"></ul>');
			let selector = (o.parseDirection == 'x') ? 'tr:gt(0) th' : 'tr:eq(0) th' ;
			self.find(selector).each(function(i){
				$('<li><span class="visualize-key-color" style="background: '+dataGroups[i].color+'"></span><span class="visualize-key-label">'+ $(this).text() +'</span></li>')
					.appendTo(newKey);
			});
			newKey.appendTo(infoContain);
		};		
		
		//append new canvas to page
		
		if(!container){canvasContain.insertAfter(this); }
		if( typeof(G_vmlCanvasManager) != 'undefined' ){ G_vmlCanvasManager.initElement(canvas[0]); }	
		
		//set up the drawing board	
		let ctx = canvas[0].getContext('2d');
		
		//create chart
		createChart[o.type]();
		
		//clean up some doubled lines that sit on top of canvas borders (done via JS due to IE)
		$('.visualize-line li:first-child span.line, .visualize-line li:last-child span.line, .visualize-area li:first-child span.line, .visualize-area li:last-child span.line, .visualize-bar li:first-child span.line,.visualize-bar .visualize-labels-y li:last-child span.line').css('border','none');
		if(!container){
		//add event for updating
		canvasContain.bind('visualizeRefresh', function(){
			self.visualize(o, $(this).empty()); 
		});
		}
	}).next(); //returns canvas(es)
};
})(jQuery);


