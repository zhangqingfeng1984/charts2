// (function(root, factory){
// 	if (typeof module === 'object' && module.export){ //CommonJS

// 	}else if (typeof define === 'function' && define.amd){ //AMD
// 		define('Chart')
// 	}else{
// 		root.Chart = factory();
// 	}
// })(function(require){

// });
var bind = function(fn, context){
	return function(){
		fn.apply(context);
	}
}
var Chart = function(options){
	this.init(options);
	this.update();
	this.render();
}

Chart.prototype ={
	constructor: Chart,
	defaults:{
		ctx: null,
		data: [[1,2],[2,4],[3,7],[4,1]],
		xAxis: null,
		yAxis: null,
		width: 400,
		height: 400,
		offset: [0, 0, 0, 0], //top,right,bottom,left
		events: {
			mousemove: function(e){
				var xPos = e.offsetX,
					yPos = e.offsetY;
				var chart = this,
					boundary = chart.boundary;

				//make sure mouse is inside chart drawing area.
				if ((xPos - boundary.x >= 0) && (xPos - boundary.x <= boundary.width)
					&& (yPos - boundary.y >= 0) && (yPos - boundary.y <= boundary.height)){
					var x = xPos - boundary.x;
					var y = yPos - boundary.y;
					var xValue = chart.xAxis.pixelToValue(x);
					var yValue = chart.yAxis.pixelToValue(y);
					console.log('mouseXY:' + x + ' , ' + y + ' , [' + xValue + ' , ' + yValue + ']');
				}
				
			}
		}
	},
	init: function(options){
		var chart = this;
		chart.options = Object.assign({}, this.defaults, options);
		chart.ctx = options.ctx;
		var offset = chart.options.offset;
		var top = offset[0],
			right = offset[1],
			bottom = offset[2],
			left = offset[3];
		chart.boundary = {
			x: left, 
			y: top, 
			width: chart.options.width - left - right,
			height: chart.options.height - top - bottom
		}
		chart.xAxis = new Axis(this, 'xAxis');
		chart.yAxis = new Axis(this, 'yAxis');

		chart.ctx.canvas.addEventListener('mousemove', chart.options.events.mousemove.bind(this))
	},
	render: function(){
		var chart = this;
		chart.xAxis.render();
		chart.yAxis.render();
		chart.drawGridLines();
	},
	update: function(){
		var chart = this;
		chart.xAxis.update();
		chart.yAxis.update();
		chart.xAxis.setTickers();
		chart.yAxis.setTickers();
	},
	drawGridLines: function(){
		var chart = this,
			ctx = chart.ctx,
			boundary = chart.boundary,
			xAxis = chart.xAxis,
			yAxis = chart.yAxis;
		//horizontal
		var xTickers = xAxis.tickers;
		ctx.save();
		ctx.strokeStyle = 'rgba(0,0,0,0.5)';
		for (var i=0; i<xTickers.length; i++){
			var ticker = xTickers[i];
			ctx.moveTo(ticker.xpos, boundary.y);
			ctx.lineTo(ticker.xpos, boundary.y + boundary.height);
		}
		ctx.stroke();
		ctx.restore();
		//vertical
		var yTickers = yAxis.tickers;
		ctx.save();
		ctx.strokeStyle = 'rgba(0,0,0,0.5)';
		for (var i=0; i<yTickers.length; i++){
			var ticker = yTickers[i];
			ctx.moveTo(ticker.xpos, ticker.ypos);
			ctx.lineTo(boundary.x + boundary.width, ticker.ypos);
		}
		ctx.stroke();
		ctx.restore();
	}

}
// Axis definitions
var Axis = function(chart, type){
	this.init(chart, type);
}
Axis.prototype ={
	constructor: Axis,
	defaults:{
		min: null,
		max: null,
		chart: null,
		type: 'xAxis' //xAxis, yAxis
	},
	init: function(chart, type){
		this.chart = chart;
		this.type = type;
		this.options = Object.assign({}, this.defaults);
	},
	render: function(){
		this.drawAxis();
		this.drawTickers();
	},
	drawAxis: function(){
		var axis = this,
			chart = axis.chart,
			boundary = chart.boundary,
			ctx = chart.ctx;
		//draw axis line
		if (axis.type === 'xAxis'){
			ctx.save();
			ctx.strokeWidth = 3;
			ctx.strokeStyle = 'green';
			ctx.moveTo(boundary.x, boundary.y + boundary.height);
			ctx.lineTo(boundary.x + boundary.width, boundary.y + boundary.height);
			ctx.stroke();
			ctx.restore();
		}else if (axis.type === 'yAxis'){
			ctx.save();
			ctx.strokeWidth = 3;
			ctx.strokeStyle = 'green';
			ctx.moveTo(boundary.x, boundary.y);
			ctx.lineTo(boundary.x, boundary.y + boundary.height);
			ctx.stroke();
			ctx.restore();
		}
	},
	drawTickers: function(){
		var axis = this,
			chart = axis.chart,
			ctx = chart.ctx;
	},
	update: function(){
		var axis = this,
			chart = axis.chart,
			data = chart.options.data;

		//calculate min max value from data
		var min, max;
		for (var i=0; i<data.length; i++){
			var arr = data[i];
			var value = axis.type === 'xAxis' ? arr[0] : arr[1];
			if (i === 0){
				min = max = value;
			}else{
				if (min > value){
					min = value;
				}
				if (max < value){
					max = value;
				}
			}
		}
		if (axis.min !== min){
			axis.min = min;
		}
		if (axis.max !== max){
			axis.max = max;
		}

		//move this to series class. calculate points
		var points = [];
		for (var i=0; i<data.length; i++){
			var xValue = data[i][0];
			var yValue = data[i][1];
			var xPos = this.valueToPixel(xValue);
			var yPos = this.valueToPixel(yValue);
			var point = {
				xValue: xValue,
				yValue: yValue,
				x: xPos,
				y: yPos
			}
			points.push(point);
		}

	},
	setTickers: function(){
		var axis = this,
			chart = axis.chart;
		//calculate tickers
		var numTickers = 10;
		var tickers = [];
		var interval = (axis.max - axis.min) / numTickers;
		if (axis.type === 'xAxis'){ //value from min to max
			for (var i=0; i<numTickers; i++){
				var xValue = axis.min + i * interval;
				var xPos = axis.valueToPixel(xValue);
				var yValue = chart.yAxis.min;
				var yPos = chart.yAxis.valueToPixel(yValue);
				var ticker = {
					xpos: xPos,
					ypos: yPos,
					xValue: xValue,
					yValue: yValue
				};
				tickers.push(ticker);
			}
		}else if (axis.type === 'yAxis'){ //value from min to max
			for (var i=0; i<numTickers; i++){
				var xValue = chart.xAxis.min;
				var xPos = chart.xAxis.valueToPixel(xValue);
				var yValue = axis.min + i * interval;
				var yPos = axis.valueToPixel(yValue);
				var ticker = {
					xpos: xPos,
					ypos: yPos,
					xValue: xValue,
					yValue: yValue
				};
				tickers.push(ticker);
			}
		}
		axis.tickers = tickers;
	},
	valueToPixel: function(value){
		var axis = this,
			chart = axis.chart,
			boundary = chart.boundary;
		if (axis.type === 'xAxis'){
			var xpos = boundary.x + (value - axis.min) /(axis.max - axis.min) * boundary.width;
			return xpos;
		}else if (axis.type === 'yAxis'){
			var ypos = boundary.y + (axis.max - value) / (axis.max - axis.min) * boundary.height;
			return ypos;
		}
		
	},
	pixelToValue: function(posXY){
		var axis = this,
			chart = axis.chart,
			boundary = chart.boundary;
		if (axis.type === 'xAxis'){
			var xValue = axis.min + posXY / boundary.width * (axis.max - axis.min);
			return xValue;
		}else if (axis.type === 'yAxis'){
			var yValue = axis.max - (posXY / boundary.height) * (axis.max - axis.min)
			return yValue;
		}
	}
}

function generateRandomData(){
	var datas = [];

	for (var i=0; i<1000; i++){
		var x = 100;
		datas.push([i, Math.random()*1000])
	}

	return datas;
}
var canvas = document.getElementById('main');
var ctx = canvas.getContext('2d');
ctx.fillStyle = 'blue';
ctx.fillRect(0, 0, 30, 30);


var chart = new Chart({ctx: ctx, data: generateRandomData()});
