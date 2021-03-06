var univertities = [
  { name: "ufmg", call: 10 }
];

var univertity = univertities[0];
var selectCalls = document.getElementById("call");
var c = 1;

while(c <= univertity.call){
  selectCalls.options[selectCalls.options.length] = new Option(c, c);
  c++;
}

changeFilter();

function changeFilter() {   
  var allFilters = {
    shift: document.getElementById("shift").value,
    modality: document.getElementById("modality").value,
    call: document.getElementById("call").value
  }

  var textDescription = document.getElementById('description-modality');
  var txt;
  switch(allFilters.modality){
    case "x":
      txt = "Candidatos sem nenhuma modalidade de cotas, que disputam em Ampla concorrência";
      break;
    case "1.1":
      txt = "Candidatos autodeclarados <b>pretos, pardos ou indígenas</b>, com <b>renda familiar bruta per capita igual ou inferior a 1,5 salário mínimo</b> e que tenha cursado integralmente o ensino médio em <b>escolas públicas</b>, pessoas com <b>deficiência</b>.";
      break;
    case "1.2":
      txt = "Candidatos autodeclarados <b>pretos, pardos ou indígenas</b>, com <b>renda familiar bruta per capita igual ou inferior a 1,5 salário mínimo</b> e que tenha cursado integralmente o ensino médio em <b>escolas públicas</b>.";
      break;
    case "2.1":
      txt = "Candidatos com <b>renda familiar bruta per capita igual ou inferior a 1,5 salário mínimo</b> que tenha cursado integralmente o ensino médio em <b>escolas públicas</b>, pessoas com <b>deficiência</b>.";
      break;
    case "2.2":
      txt = "Candidatos com <b>renda familiar bruta per capita igual ou inferior a 1,5 salário mínimo</b> que tenha cursado integralmente o ensino médio em <b>escolas públicas</b>.";
      break;
    case "3.1":
      txt = "Candidatos autodeclarados <b>pretos, pardos ou indígenas</b> que, independentemente da renda, tenha cursado integralmente o ensino médio em <b>escolas públicas</b>, pessoas com <b>deficiência</b>.";
      break;
    case "3.2":
      txt = "Candidatos autodeclarados <b>pretos, pardos ou indígenas</b> que, independentemente da renda, tenha cursado integralmente o ensino médio em <b>escolas públicas</b>.";
      break;
    case "4.1":
      txt = "Candidatos que, independentemente da renda, tenham cursado integralmente o ensino médio em <b>escolas públicas</b>, pessoas com <b>deficiência</b>.";
      break;
    case "4.2":
      txt = "Candidatos que, independentemente da renda, tenham cursado integralmente o ensino médio em <b>escolas públicas</b>.";
      break;
    default:
      txt = "Candidatos sem nenhuma modalidade de cotas, que disputam em Ampla concorrência";
      break;
  }
  textDescription.innerHTML = txt;

  d3.csv("data/ufmg/"+ allFilters.call +".csv", function(data) {
    var groupedData = null,
      filteredData = null,
      hasFilter = true,
      arrayMax = [],
      arrayMin = [],
      arrayElements = [];

    data.forEach(function(d){
      groupedData = d3.nest()
        .key(function(d) {return d["course"];})
        .rollup((function(d) {
          return d;
        }))
        .entries(data);
    });
    
    groupedData.forEach(function(item, index){
      var filter = item.value.filter(function(inst){
        if(allFilters.shift != 'all')
          return inst.modality === allFilters.modality
            && inst.shift === allFilters.shift;
        else
          return inst.modality === allFilters.modality;
      });

      if(filter.length){
        hasFilter = true;
        arrayMax.push(parseFloat(filter[0].max));
        arrayMin.push(parseFloat(filter[0].min));
        arrayElements.push(filter[0]);
      }else{
        hasFilter = false;
        var newItem = { 
          course: item.key,
          shift: null,
          modality: null,
          min:"-1",
          max:"-1"
        }
        arrayMax.push(parseFloat(newItem.max));
        arrayMin.push(parseFloat(newItem.min));
        arrayElements.push(newItem);
      }
    });

    var filteredData = {
      max: arrayMax,
      min: arrayMin,
      el: arrayElements
    }

    buildGraph(filteredData);     
  });

  /**
   * buildGraph function that create graph bar with filtered data values
   *
   * @param  {object} data information about courses, like scores, name and shift
   */
  function buildGraph(data){
    var n = 2,
      m = data.el.length,
      widthDynamic = 17.74 * m;
    var scoreMax = 1000;
    var xz = d3.range(m),
      yz = [data.min, data.max, data.el],
      y01z = d3.stack().keys(d3.range(n))(d3.transpose(yz)),
      yMax = d3.max(yz, function(y) { return d3.max(y); }),
      y1Max = yMax;

    d3.select("svg").remove();
    var svg = d3.select("#box-svg")
        .append("svg")
        .attr("width", widthDynamic)
        .attr("height", 700);

    var margin = {top: 40, right: 10, bottom: 200, left: 10},
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var begin = 0, final = height;

    var x = d3.scaleBand()
        .domain(xz)
        .rangeRound([0, width])
        .padding(0.08);
    
    var y = d3.scaleLinear()
      .domain([scoreMax, 0])
      .range([final, 0]);

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + (height) + ")")
        .call(d3.axisBottom(x)
            .tickSize(0)
            .tickPadding(6)
            .tickFormat(function(d, i){ return data.el[d].course; }))
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .style("font-size", 9.5)
          .attr("class", "name-courses")
          .attr("transform", "rotate(90)")
          .style("text-anchor", "start");

    var colors = ["#b8d1d5", "#7eaeb6"];

    var series = g.selectAll(".series")
      .data(y01z)
      .enter().append("g")
        .attr("fill", function(d, i) { return colors[i]; });

    var rect = series.selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
        .attr("x", function(d, i) { return x(i); })
        .attr("y", function(d) {
          if(d[0] == 0){
            return final - y(d[1]);
          }
          return final -  y((d[1]-d[0]));
        })
        .attr("width", x.bandwidth())
        .attr("id", function(d, i) { return (d[0] + "rec" + d[1] + i)})
        .attr("height", function(d) { 
          var h = y((d[1]));
          if(d[0] == 0 || d[1] == -1) if(h < 0) return 0; else return h;
          var h = y((d[1]-d[0])-d[0]);
          if(h < 0) return 0; else return h;
        })
        .attr("d1", function(d) { return d[1] })
        .attr("mx", function(d) { return d.data[2].max })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);
    
    d3.selectAll("button")
      .on("click", buildLine);

    compareCourses();

    /**
     * compareCouses
     * 
     */
    function compareCourses() {
      var score = parseFloat(document.getElementById("score").value);
      if(score){
        var scoreLine = d3.select("#line")._groups[0][0].getAttribute("yl");
        var rectsMin = series.selectAll("rect")._groups[0],
          rectsMax = series.selectAll("rect")._groups[1];
        var axisX = d3.selectAll(".name-courses")._groups[0];

        rectsMin.forEach(function(rect, index){
          if(score < rect.getAttribute("d1") || rect.getAttribute("mx") == -1){
            rect.style.opacity = .2;
            rectsMax[index].style.opacity = .2;
            axisX[index].style.opacity = .3;
          }else{
            rect.style.opacity = 1;
            rectsMax[index].style.opacity = 1;
            axisX[index].style.opacity = 1;
          }
        })
      }
    }

    /**
     * buildLine create line for show score from input
     * 
     */
    function buildLine() {
      d3.select("#line").remove();
      var begin = margin.bottom + y(margin.top), final = height;
      var yl = d3.scaleLinear()
        .domain([scoreMax, 0])
        .range([final, 0]);

      var score = parseFloat(document.getElementById("score").value) || null;
      
      if(score) {
        var yline = yl(score) + begin;

        console.log(yline);
        var svgLine = d3.select("#box-line")
          .append("svg")
          .attr("width", 1260)
          .attr("height", 2)
          .style("background", "#bc223f")
          .style("opacity", 1)
          .attr("id", "line")
          .attr("yl", yline)
          .attr("transform", "translate(0,"+ -yline +")");
      }else{
        var allRects = series.selectAll("rect"),
          axisX = d3.selectAll(".name-courses")._groups[0];
          axisX.forEach(function(item){
            item.style.opacity = 1
          });
          allRects.style("opacity", 1);
      }

      compareCourses();

    }

    /**
     * handleMouseOver   function for create opacity efects when hover rectangle and show values max and min scores
     * 
     * @param  {object}  d object received from rectangle
     * @param  {integer} i index on serie array
     */
    function handleMouseOver(d, i) {
      var rectMin = series.selectAll("rect")._groups[0][i],
        rectMax = series.selectAll("rect")._groups[1][i],
        allRects = series.selectAll("rect"),
        ymin = rectMin.getAttribute("y"),
        ymax = rectMax.getAttribute("y");

        allRects.style("opacity", .2);
        rectMax.style.opacity = 1;
        rectMin.style.opacity = 1;

      svg.append("text")
        .attr("y", ymin + 20)
        .attr("x", function(){ if(i<(m-1)) return x(i)+25; else return x(i)-25; })
        .text(d.data[2].min)
        .attr("dy", ".35em")
        .attr("id", d[0] + "elmin" + d[1])
        .style("text-anchor", "start");

      svg.append("text")
        .attr("y", ymax)
        .attr("x", x(i))
        .text(d.data[2].max)
        .attr("dy", ".35em")
        .attr("id", d[0] + "elmax" + d[1])
        .style("text-anchor", "start");

      svg.append("text")
        .attr("y", ymax - 50)
        .attr("x", function(){ if(i>9 && i<(m-9)) return x(i); else if(i>=(m-9)) return x((m-9)); else return x(0); })
        .text(d.data[2].course)
        .attr("dy", ".35em")
        .attr("id", d[0] + "elname" + d[1])
        .style("text-anchor", "start");
    }

    /**
     * handleMouseOut function for show opacity 1 in all reactangles and hide values max and min scores
     * 
     * @param  {object}  d object received from rectangle
     */
    function handleMouseOut(d) {
      var idmin = d[0] + "elmin" + d[1],
        idmax = d[0] + "elmax" + d[1],
        idname = d[0] + "elname" + d[1],
        allRects = series.selectAll("rect"),
        axisX = d3.selectAll(".name-courses")._groups[0];
        axisX.forEach(function(item){
          item.style.opacity = 1
        });
        allRects.style("opacity", 1);

      document.getElementById(idmin).remove();
      document.getElementById(idmax).remove();
      document.getElementById(idname).remove();

      compareCourses();
    }

    /**
     * event listener keyup event and get click on 'Enter'
     * 
     */
    document.addEventListener("keyup", function(event) {
      event.preventDefault();
      if (event.keyCode === 13) {
        buildLine();
      }
    });
  }
}