var _zoomItems = new Array("1200%", "1000%", "900%", "800%", "400%","200%", "150%", "125%", 
                                                    "100%","80%","75%", "66.67%", "50%", "33.33%", "25%","18.5%","----------","Actual Size","Fit Page","Fit Width");
var _svgFormat = new Array(".pdf",".doc",".docx",".docm",".dotx",".dotm",".xls",".xlsx",".xlsm",".xltx",".ppt",".pps",".pptx",".ppsx",".pptm",".potm",".potx",".ppsm");
var _wordFormat = new Array(".doc",".docx",".docm",".dotx",".dotm");
var _excelFormat = new Array(".xls",".xlsx",".xlsm",".xltx");
var _pptFormat = new Array(".ppt",".pps",".pptx",".ppsx",".pptm",".potm",".potx",".ppsm");                                    
var clientWidth = window.innerWidth - 17;
var clientHeight = window.innerHeight - 17;
var leftPartWidth = 180;
var thumbImgWidth = 140;
var thumbImgHeight = 180;
var addWidth = 5;
var addHeight = 7;
var REViewer = new DocViewer();
var WidthArray = new Array();
var HeightArray = new Array();
var _showPageIds = new Array();
var _showDocSrc = new Array();
var timeout = false;
var _viewerMode = "multi";
var _curCorrectPageId = 0;
var sym;
var zoomValue = 1;
var _zoomListIndex = 8;
var _docWidth = 0;
var _docHeight = 0;
var widthMax = 0;
var heightMax = 0;
var _suffix = "";
var _imageFormat = "Svg";

function DocViewer()
{
    this.fileName = "";
    this.pageCount = 0;
    this.pageSize = "";
    this.outLine = "";
    
    this.LoadMes = function(_fileName,_pageCount,_pageSize)
    {
        this.fileName = _fileName;
        this.pageCount = _pageCount;
        this.pageSize = _pageSize;
        var _size = this.pageSize.split(";");
        for(var i=0;i<_size.length-1;i++)
        {
            var xy = _size[i].split("|");
            WidthArray[i] = parseInt(xy[0]);
            HeightArray[i] = parseInt(xy[1]);
        }
        widthMax = WidthArray.max();
        heightMax = HeightArray.max();
        ChangeThumbnailSize();
        onloadReady();
    }
}


function ChangeThumbnailSize()
{
	
	var thumbHeightArray = new Array();
	for(var i=0;i<REViewer.pageCount;i++)
	{
		var width = WidthArray[i];
		var height = HeightArray[i];
		var zoom = 140/width;
		thumbHeightArray.push(zoom*height);
	} 
	thumbImgHeight = thumbHeightArray.max();
}


function onloadReady()
{
    var fileName = REViewer.fileName;
    _suffix = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
    if(!_svgFormat.in_array(_suffix))
        _imageFormat = "Bitmap";
    setStyle();
    CreateToolbar("#_toolbar");
    CreateThumbPanel("#_thumb");
    CreateDocPanel("#_doc");
    InitBtnCss();
    ThumbShrink();
    SetViewerMode();
    InitFileType();
    ChangePg(_curCorrectPageId);
    map();
    $("#navi_cursor").trigger("click");
    $("#_plcImgsThumbs").scroll(function()
    {
        if (timeout)
		{clearTimeout(timeout);}
	    timeout = setTimeout(function()
		{	
            addShowPageIds();			
	    },1000);
    });
    var initTop = 0;
    var threshold = 0.8;
    $("#_doc").scroll(function(e)
    {
	    if(_viewerMode == "multi")
		{
            setTimeout(function(){
                if(_viewerMode == "single")
                    return;
                var countHeight = $("#_doc").scrollTop();
                var intNum = PrePageCount(countHeight);
                var testNum = countHeight - PreCountHeight(intNum);
                var percent = intNum + testNum/((HeightArray[intNum]+addHeight)*zoomValue);
                var value = percent;
                var period = parseInt(percent);
                var UpValue;
                var DownValue;
                if($("#_doc").scrollTop() > initTop)
                {
                    DownValue = parseFloat(period + threshold);
                    if(parseFloat(percent) >= DownValue)
                    {
                        value = period + 1;
                        var max = REViewer.pageCount - 1;
                        value = value <= max ? value : max;  
                    } 
                    if(parseInt(value) != _curCorrectPageId)
                    {
                        $("#pageIdList").val(parseInt(value+1));
                        ChangeThumbScrollBar(parseInt(value),false);
                        _curCorrectPageId = parseInt(value);
                        ChangeDivCssClass(_curCorrectPageId);
                        addShowDocIds();
                        if(REViewer.pageCount != 1)
                            ChangeBtnStyle();
                     }
                }
                else if($("#_doc").scrollTop() < initTop)
                {
                    DownValue = parseFloat(period + threshold);
                    if(parseFloat(percent) > DownValue)
                        return;
                    else(parseFloat(percent) <= DownValue)
                        value = period;
                    if(parseInt(value) != _curCorrectPageId)
                    {
                        $("#pageIdList").val(parseInt(value+1));
                        ChangeThumbScrollBar(parseInt(value),true);
                        _curCorrectPageId = parseInt(value);
                        ChangeDivCssClass(_curCorrectPageId);
                        addShowDocIds();
                        if(REViewer.pageCount != 1)
                            ChangeBtnStyle();
                     }
                }
                initTop = $("#_doc").scrollTop();        
		  },1000);
      }
    });
}

function setStyle()
{
    $("#_container").width(clientWidth+"px");
    $("#_container").height(clientHeight+"px");
    $("#_toolbar").width(clientWidth+"px");
    $("#_thumb").height((clientHeight-40)+"px");
    $("#_doc").width((clientWidth-leftPartWidth)+"px");
    $("#_doc").height((clientHeight-40)+"px");
    _docWidth = clientWidth - leftPartWidth - 17;
    _docHeight = clientHeight - 40 - 17;
}

function CreateToolbar(viewerId)
{
    var thumbIcon = "<div id='_thumbIcon' style='width:29px;height:34px;float:left;margin-left:10px;margin-top:2px;'></div>";
    $(viewerId).append(thumbIcon);
    $("#_thumbIcon").css("background","url('source/image/RE_wt_iconsC1.png') no-repeat 0px 0px");
    TargetHover("#_thumbIcon",true);
    $("#_thumbIcon").bind("click",ThumbEvent);
    
    var toolbarPanel = "<div id='_toolPanel' style='width:480px;height:40px;margin:0 auto;'></div>";
    $(viewerId).append(toolbarPanel);
    CreatePagePart("#_toolPanel");
    CreatePageModePart("#_toolPanel");
    CreateZoomPart("#_toolPanel");
    CreateCursor("#_toolPanel");
}

function CreatePagePart(toolId)
{
    var firstPage = "<div id='navi_first' title='first page'></div>";
    $(toolId).append(firstPage);
    var prePage = "<div id='navi_pre' title='previous page'></div>";
    $(toolId).append(prePage);
    
    var pageNavi = "<div id='selectCss' style='font-size:15px'></div>";
    $(toolId).append(pageNavi);
    var pageList = "<select class='navi_page' id='pageIdList' style='width:40px'></select>&nbsp;&nbsp;/&nbsp;&nbsp;"+REViewer.pageCount+"";
    $("#selectCss").append(pageList);
    
    var nextPage = "<div id='navi_ne' title='next page'></div>";
    $(toolId).append(nextPage);
    var lastPage = "<div id='navi_last' title='last page'></div>";
    $(toolId).append(lastPage);
    $("#navi_last").css("margin-right","20px");
    InitPageIdItems("#pageIdList");
}

function InitPageIdItems(divId)
{
    for(var i=1; i<=REViewer.pageCount;i++)
    {
        $(divId).append($('<option></option>').html(i)); 
    }
    $(divId).val("1").attr("selected",true);
	$(divId).bind("change", ChangeItem);
}

function ChangeItem()
{
	var changeValue = $(this).val() - 1;
	var isUp = true;
	if (changeValue > parseInt(_curCorrectPageId))
	{
		isUp = false;
	}
	ChangeThumbScrollBar(changeValue, isUp);
	ChangePg(changeValue);
	$("#pageIdList").blur();
}

function CreatePageModePart(toolId)
{
    var singleMode = "<div id='navi_single' title ='single page' onclick='btnSinglePage()'></div>";
    $(toolId).append(singleMode);
    TargetHover("#navi_single",true);
    var continuesMode = "<div id='navi_multi' title='continues page'onclick='btnContinuesPage()'></div>";
    $(toolId).append(continuesMode);
    TargetHover("#navi_multi",true);
    $("#navi_multi").css("margin-right","20px");
}

function CreateZoomPart(toolId)
{
    var zoomOut = "<div id='navi_zoomOut' title='zoomOut' onclick='btnZoomOut()'></div>";
    $(toolId).append(zoomOut);
    TargetHover("#navi_zoomOut",true);
    var zoomItems = "<div id='selectCss'><select class='navi_zoom' id='zoomList'></select></div>";
    $(toolId).append(zoomItems);
    InitZoomItems("#zoomList");
    var zoomIn = "<div id='navi_zoomIn' title='zoomIn' onclick='btnZoomIn()'></div>";
    $(toolId).append(zoomIn);
    TargetHover("#navi_zoomIn",true);
    $("#navi_zoomIn").css("margin-right","20px");
}

var curPan = false;
function CreateCursor(toolId)
{
    var cursor = "<div id='navi_cursor' style='width:26px;height:26px;float:left;margin-top:10px;' title='Pan' onclick=''></div>";
    $(toolId).append(cursor);
    $("#navi_cursor").css("background","url('source/image/hand.png') no-repeat -9px -8px");
    TargetHover("#navi_cursor",true);
    $("#navi_cursor").bind("click",function(){
        if(!curPan)
        {
            $(".docImages object").css("pointer-events","none");
            $(".showByDrag").bind("mousedown",dragImageMouseDown);
		    $(".showByDrag").bind("mousemove",dragImageMouseMove);
		    $(".showByDrag").bind("mouseup",dragImageMouseUp);
		    $(".showByDrag").addClass("pointCursor");
            $("#navi_cursor").addClass("iconBorder");
            curPan = true;
        }
        else
        {
            $(".docImages object").css("pointer-events","auto");
            $(".showByDrag").unbind("mousedown",dragImageMouseDown);
		    $(".showByDrag").unbind("mousemove",dragImageMouseMove);
		    $(".showByDrag").unbind("mouseup",dragImageMouseUp);
		    $(".showByDrag").removeClass("pointCursor");
            $("#navi_cursor").removeClass("iconBorder");
            curPan = false;
        }
    });
}

function InitFileType()
{
    if(_imageFormat == "Svg" || _suffix == ".jbig2")
    {
        $("#zoomList").val("Actual Size").attr("selected",true);                 
        _zoomListIndex = 17;
        zoomValue = 1;
    }
    else if(_imageFormat == "Bitmap")
    {
        $("#zoomList").val("Fit Page").attr("selected",true);
        _zoomListIndex = 18;
        setZoomValue();
    } 
}

var isDragIn = false;
var divScrollLeft = 0;
var divScrollTop = 0;
var divScrollWidth = 0;
var divScrollHeight = 0;
var xDown = 0,yDown = 0;
var dragImageMouseDown = function(e)
{
    isDragIn = true;
    divScrollLeft = $("#_doc")[0].scrollLeft;
	divScrollTop = $("#_doc")[0].scrollTop;
	divScrollWidht = $("#_doc")[0].scrollWidth;
	divScrollHeight = $("#_doc")[0].scrollHeight;
	e = e || window.event;
	xDown = e.pageX;
	yDown = e.pageY;
	return false;
}

var dragImageMouseMove = function(e)
{
    if(isDragIn)
    {
        e = e || window.event;
        xMove = e.pageX;
        yMove = e.pageY;
        move_x = xMove - xDown;
		move_y = yMove - yDown;
        moveLeft = divScrollLeft - (move_x);
		moveTop = divScrollTop - (move_y);
		if(moveLeft>0 && moveLeft<divScrollWidht)
		{
		    $("#_doc")[0].scrollLeft = moveLeft;
		}
		if(moveTop>0 && moveTop<divScrollHeight);
		{
			$("#_doc")[0].scrollTop = moveTop;
		}
    }
    return false;
}

var dragImageMouseUp = function(e)
{
    isDragIn = false;
    return false;
}

function InitZoomItems(divId)
{
    for(var i=0; i<_zoomItems.length;i++)
    {
        if(i==16)
        {
            var option = "<option disabled='disabled'>"+_zoomItems[i]+"</option>"
            $(divId).append(option);
        }
        else
            $(divId).append( $('<option></option>').html(_zoomItems[i])); 
    }
    $(divId).val("Actual Size").attr("selected",true);
    $(divId).bind("change",setZoomValue);
}

function setZoomValue()
{
     _zoomListIndex = parseInt($("#zoomList").get(0).selectedIndex);	
     var pageIndex = parseInt(_curCorrectPageId);
     if(_zoomListIndex >=0 && _zoomListIndex<=15)
     {
        var length = _zoomItems[_zoomListIndex].length;
        var multiple = _zoomItems[_zoomListIndex].substring(0,length-1);
        zoomValue = parseFloat(multiple)/100;       		    
      }
      else
      {
           switch(_zoomListIndex)
           {
                case 17:
                    zoomValue = 1;
                    _zoomListIndex = 8;
                    break;
                case 18:
                    var percent = (_docHeight/(HeightArray[pageIndex]+addHeight)*100).toFixed(2);
                    zoomValue = percent/100;
                    _zoomListIndex = setPercentPosition(percent);
                    break;
                case 19:
                    var percent = (_docWidth/(WidthArray[pageIndex]+addWidth)*100).toFixed(2);
                    zoomValue = percent/100;
                    _zoomListIndex = setPercentPosition(percent);
                    break;  
           } 
      }
      resizeDocViewerByCSS3("imgBig",pageIndex);
      CSSZoomInOrOut();
      $("#zoomList").blur();
}

function setPercentPosition(percent)
{
    var _comlength = _zoomItems.length;
    for(var i=0;i< _comlength - 3;i++)
    {
        var length = _zoomItems[i].length;
        var multiple = parseInt(_zoomItems[i].substring(0,length-1));
        if(percent>= parseFloat(multiple))
        return i;
    }
    return _comlength - 4;
}

function map()
{
    switch(_zoomListIndex)
    {
        case 17:
            zoomValue = 1;
            _zoomListIndex = 8;
            break;
        case 18:
            var percent = (_docHeight/(HeightArray[pageIndex]+addHeight)*100).toFixed(2);
            zoomValue = percent/100;
            _zoomListIndex = setPercentPosition(percent);
            break;
        case 19:
            var percent = (_docWidth/(WidthArray[pageIndex]+addWidth)*100).toFixed(2);
            zoomValue = percent/100;
            _zoomListIndex = setPercentPosition(percent);
            break; 
    } 
}

function btnZoomIn()
{
    var value = zoomValue;
    var posiW = $("#_doc").scrollLeft()/value;
    var posiH = $("#_doc").scrollTop()/value;
    var pageIndex = parseInt(_curCorrectPageId);
    ChangeZoomIndex("1");
    resizeDocViewerByCSS3("imgBig",pageIndex);
    $("#_doc").scrollLeft(posiW * zoomValue);
    $("#_doc").scrollTop(posiH * zoomValue);
    CSSZoomInOrOut();
}

function btnZoomOut()
{
    var value = zoomValue;
    var posiW = $("#_doc").scrollLeft()/value;
    var posiH = $("#_doc").scrollTop()/value;
    var pageIndex = parseInt(_curCorrectPageId);
    ChangeZoomIndex("-1");
    resizeDocViewerByCSS3("imgBig",pageIndex);
    $("#_doc").scrollLeft(posiW * zoomValue);
    $("#_doc").scrollTop(posiH * zoomValue);
    CSSZoomInOrOut();
}

function ChangeZoomIndex(changeValue)
{
    if(changeValue == "-1")
    {
        _zoomListIndex++;
		if(_zoomListIndex > 15)
		    _zoomListIndex = 15;
    }
    else if(changeValue == "1")
    {
        _zoomListIndex--;
		if(_zoomListIndex < 0)
		    _zoomListIndex = 0;
    }
    $("#zoomList").val(_zoomItems[_zoomListIndex]);	
	var length = _zoomItems[_zoomListIndex].length;
    var multiple = _zoomItems[_zoomListIndex].substring(0,length-1);
    zoomValue = parseFloat(multiple)/100;
}

function resizeDocViewerByCSS3(target,pageIndex)
{
    var firstWidth = 0;
    var firstHeight = 0;
    var firstLeft = 0;
    var firstTop = 0;
    var actualWidth = 0;
    var actualHeight = 0;
    var bigWidth = 0;
    var bigHeight = 0;
    if(_viewerMode == "single")
    {
        firstWidth = WidthArray[pageIndex];
        firstHeight = HeightArray[pageIndex];
        firstLeft = (_docWidth - firstWidth)/2;
        firstTop = (_docHeight - firstHeight)/2;
        actualWidth = (WidthArray[pageIndex] + addWidth) * zoomValue;
        actualHeight = (HeightArray[pageIndex] + addHeight) * zoomValue;
    }
    else
    {
        var widthPageIndex = WidthArray.indexOf(widthMax);
        var heightPageIndex = HeightArray.indexOf(heightMax);
        firstWidth = WidthArray[widthPageIndex];
        firstHeight = HeightArray[heightPageIndex];
        firstLeft = (_docWidth - firstWidth)/2;
        firstTop = (_docHeight - firstHeight)/2;
        actualWidth = (WidthArray[widthPageIndex] + addWidth)*zoomValue;
        actualHeight = (HeightArray[heightPageIndex] + addHeight) * zoomValue;
    }
    var BigWidth = actualWidth - addWidth * zoomValue;
    var BigHeight = actualHeight - addHeight * zoomValue;
    if(BigWidth < _docWidth)
    {
        if(parseInt(actualWidth) != _docWidth)  
			    BigWidth = _docWidth;
    }
    if(BigHeight < _docHeight)
    {
        if(parseInt(actualHeight) != _docHeight)
            BigHeight = _docHeight;
    }
 
    var bigWidth = actualWidth > _docWidth ? actualWidth : _docWidth;
    var bigHeight = actualHeight > _docHeight ? actualHeight : _docHeight; 
    $("#re_canvas").css({"width":bigWidth+"px","height":bigHeight+"px"});
        
    $("#"+target).css({"width":firstWidth+"px","height":firstHeight+"px"}); 
	$("#"+target).css({"top":firstTop+"px","left":firstLeft+"px","position":"absolute"});   
    $(".docImages").css({"width":firstWidth+"px","height":firstHeight+"px"});	
    if(_viewerMode == "single")
        $("#page_"+pageIndex).css({"left":0+"px","top":0+"px"});
    else
    {
        for(var i=0;i<REViewer.pageCount;i++)
        {
            if(WidthArray[i] != widthMax)
            {
			    $("#page_"+i).css({"width":WidthArray[i]+"px"});
			    var tempLeft = (_docWidth - WidthArray[i])/2;
			    $("#page_"+i).css({"left":(tempLeft-firstLeft)+"px"}); 
            }
            if(HeightArray[i] != heightMax)
            {
                $("#page_"+i).css({"height":HeightArray[i]+"px"});
            }
        }
    }
    
    target = document.getElementById(target);
    var translateX = 0;
    var translateY = 0;
    if(_viewerMode == "single")
    {
        translateX = (BigWidth  - _docWidth)/(2*zoomValue);
        translateY = (BigHeight - _docHeight)/(2*zoomValue);
    }
    else
    {
        translateX = (BigWidth  - _docWidth)/(2*zoomValue);
        if(BigHeight == _docHeight) 
            translateY = (actualHeight  - _docHeight)/(2*zoomValue);
        else
            translateY = (BigHeight - _docHeight)/(2*zoomValue);
    }
    
    if(target.style.msTransform !== undefined)//IE
    {
        target.style.msTransform = 'scale('+zoomValue+') translateX(' + translateX+'px) translateY(' + translateY+'px)';
        
    }
    else if(target.style.MozTransform !== undefined)//Mozilla
    {
        target.style.MozTransform = 'scale(' + zoomValue + ') translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
    }
    else if(target.style.OTransform !== undefined)//opera
    {
        target.style.OTransform = 'scale(' + zoomValue + ') translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
    }
    else if(target.style.webkitTransform !== undefined) //chrome Safari
    {
        target.style.webkitTransform = 'scale(' + zoomValue + ') translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
    }
    else
    {
        target.style.transform = 'scale(' + zoomValue + ') translateX(' + translateX + 'px) translateY(' + translateY + 'px)';
    }
}

var _zoomInFlag = true;
var _zoomOutFlag = true;
function CSSZoomInOrOut()
{
	var icoUrl1 = "source/image/RE_wt_iconsB1.png";
	if(_zoomListIndex == 0)
	{   
	    $("#navi_zoomIn").css("background","url('" + icoUrl1 + "') no-repeat -735px 0px");
		TargetHover("#navi_zoomIn",false);
		if(_zoomInFlag)
		{
		    $("#navi_zoomIn").removeAttr("onClick");
		    $("#navi_zoomIn").unbind("click");
		    _zoomInFlag = false;
		}
	}
	else if(_zoomListIndex == 15)
	{
	    $("#navi_zoomOut").css("background","url('" + icoUrl1 + "') no-repeat -707px 0px");
		TargetHover("#navi_zoomOut",false);
		if(_zoomOutFlag)
		{
            $("#navi_zoomOut").removeAttr("onClick");
            $("#navi_zoomOut").unbind("click");
		    _zoomOutFlag = false;
		}
	}
	else
	{
		iconUrl1 = "source/image/RE_wt_iconsA1.png";
		if(!_zoomInFlag)
		{
		    $("#navi_zoomIn").css("background","url('" + iconUrl1 + "') no-repeat -735px 0px");
		    TargetHover("#navi_zoomIn",true);
		    $("#navi_zoomIn").bind("click",btnZoomIn);
		    _zoomInFlag = true;
		 }
		 if(!_zoomOutFlag)
		 {
		    $("#navi_zoomOut").css("background","url('" + iconUrl1 + "') no-repeat -707px 0px");
		    TargetHover("#navi_zoomOut",true);
		    $("#navi_zoomOut").bind("click",btnZoomOut);
		    _zoomOutFlag = true;
		 }
	}
}

function SetViewerMode()
{
    if(_suffix == ".pdf" || _wordFormat.in_array(_suffix) || _pptFormat.in_array(_suffix))
    {
        _viewerMode = "multi";
        btnContinuesPage();
    }
    else
    {
        _viewerMode = "single";
        btnSinglePage();
    } 
}

function btnSinglePage()
{
    _viewerMode = "single";
    var posi = $("#_doc").scrollTop();
    $("#navi_multi").removeClass("iconBorder");
    $("#navi_single").addClass("iconBorder");
    var currentPg = parseInt(_curCorrectPageId);
    var singlePosi = posi - PreCountHeight(currentPg);
    for(var i=0;i<REViewer.pageCount;i++)
    {
        if(i != currentPg)
            $("#page_"+i).hide();
    }
    resizeDocViewerByCSS3("imgBig",currentPg);
    ChangePg(currentPg);
    $("#_doc").scrollTop(singlePosi);
}

function btnContinuesPage()
{
    _viewerMode = "multi";
    var posi = $("#_doc").scrollTop();
    $("#navi_single").removeClass("iconBorder");
    $("#navi_multi").addClass("iconBorder");
    var currentPg = parseInt(_curCorrectPageId);
    for(var i=0;i<REViewer.pageCount;i++)
        $("#page_"+i).show();
    resizeDocViewerByCSS3("imgBig",currentPg);
    var countHeight = PreCountHeight(_curCorrectPageId);
    $("#_doc").scrollTop(countHeight + posi);
}

function CreateThumbPanel(viewerId)
{
    var thumbWidth = leftPartWidth - 20;
    var thumbHeight = _docHeight - 40;
    var thumbViewer = "<div id='_plcImgsThumbs' class='RE_ThumbViewer' style='width:" + thumbWidth + "px;height:"+thumbHeight+"px;'></div>";
    var thumbImg = "<div id='_thumbImg'></div>";
    $(viewerId).append(thumbViewer);
    $("#_plcImgsThumbs").append(thumbImg);
    CreateThumbImageControl("_thumbImg");
}

function CreateThumbImageControl(thumbId)
{
    $("#"+thumbId).empty();
    for(var i=0;i<REViewer.pageCount;i++)
    {
        var lbl = "<div class='thumbnail' id='lbl_" + i + "' onclick='ChangePg(" + i + ")'></div>";
		$("#"+thumbId).append(lbl);
		
		var thumbDiv = "<div class='thumbDiv' id='thumbDiv_" + i + "' style='width:" + thumbImgWidth + "px;height:" + thumbImgHeight + "px;text-align:center;'></div>";
		$("#lbl_" + i).append(thumbDiv);
		CreateThumbImage("#thumbDiv_"+i,i);       
		var thumbPageIndex = "<div id='thumbPgId_" + i + "' class='thumbPgId'>" + (i + 1) + "</div>";
        $("#thumbDiv_" + i).after(thumbPageIndex);
    }
}

function CreateThumbImage(divId,index)
{
    var src = "source/image/thumb_upload.gif";

    var image = "<img id='thumbnail_" + index + "' src ='" + src + "'/>";
	
	$(divId).append(image);
}

function InitBtnCss()
{
    sym = new Array(false,false);
    var icoUrl1 = "source/image/RE_wt_iconsB1.png";
    $("#navi_first").css("background","url('" + icoUrl1 + "') no-repeat -635px 0px");
    TargetHover("#navi_first",false);
    $("#navi_pre").css("background","url('" + icoUrl1 + "') no-repeat -613px 0px");
    TargetHover("#navi_pre",false);
    $("#navi_ne").css("background","url('" + icoUrl1 + "') no-repeat -684px 0px");
    TargetHover("#navi_ne",false);
    $("#navi_last").css("background","url('" + icoUrl1 + "') no-repeat -662px 0px");
    TargetHover("#navi_last",false);
}

function addShowPageIds()
{
    if(isShrink)
        return;
    var addIds = new Array();
    var sTop = $("#_plcImgsThumbs").scrollTop();
    var divOuterHeight = $(".thumbnail").outerHeight(true);
	if(divOuterHeight == 25)
	    divOuterHeight = $(".thumbDiv").outerHeight(true);
	var totalHeight =  $("#_plcImgsThumbs").height();
	var showCount = parseInt(totalHeight/divOuterHeight) + 1;
	var currentThumbTopId = parseInt(sTop/divOuterHeight);
	if(_showPageIds.length == REViewer.pageCount)
	    return;
	for(var i=0;i<showCount;i++)
	{
	    var showId = currentThumbTopId + i;
	    if(showId > -1 && showId < REViewer.pageCount)
		{
			if(!_showPageIds.in_array(showId))
			{
			    _showPageIds.push(showId);
			    addIds.push(showId);
			}
	    }
	}
	refreshThumbViewer(addIds);
}

function refreshThumbViewer(refreshIds)
{
    var src = "source/image/thumb_upload.gif";
    for(var index=0; index<refreshIds.length; index++)
	{
	    var pageIndex = refreshIds[index];				
	    var thumbPath = "thumb/"+pageIndex+".png";
		$("#thumbnail_"+pageIndex).attr("src", thumbPath);
	}
}

function CreateDocPanel(viewerId)
{
    var width = $(viewerId).outerWidth(true);
    var height = $(viewerId).outerHeight(true);
	var canvasPanel = "<div id='re_canvas' style='background:#bbbbbb;position:relative;width:"+(width-17)+"px;height:"+(height-17)+"px;margin:0 auto;'></div>";
    $(viewerId).append(canvasPanel);
    var ImagePanel = "<div id='imgBig' style='margin:0 auto;' class='showByDrag'></div>";
    $("#re_canvas").append(ImagePanel);
    for(var i=0;i<REViewer.pageCount;i++)
    {
    	var divDoc = "<div class='docImages' id='page_"+i+"' style='width:"+WidthArray[i]+"px;height:"+HeightArray[i]+"px;background:#ffffff'></div>";
        $("#imgBig").append(divDoc);
	$("#page_"+i).css("border","1px solid #000000");
        $("#page_"+i).css('box-shadow','3px 3px 0px #000000');
    }
}

var isShrink = true;
function ThumbEvent()
{
    if(isShrink)
        ThumbExpansion();
    else
        ThumbShrink();
}

function ThumbShrink()
{
    isShrink = true;
    leftPartWidth = 0;
    $("#_thumb").hide();
    var width = clientWidth - leftPartWidth;
    $("#_doc").width(width+"px");
    $("#re_canvas").width(width - 17);
    _docWidth = width  - 17;
    resizeDocViewerByCSS3("imgBig",_curCorrectPageId);
}

function ThumbExpansion()
{
    isShrink = false;
    leftPartWidth = 180;
    $("#_thumb").show();
    var width = clientWidth - leftPartWidth;
    $("#_doc").width(width+"px");
    $("#re_canvas").width(width - 17);
    _docWidth = width  - 17;
    resizeDocViewerByCSS3("imgBig",_curCorrectPageId);
    addShowPageIds();
}

function ChangePg(pageIndex)
{
    var prePageIndex = _curCorrectPageId;
    if(pageIndex == prePageIndex)
    {
        if(_showDocSrc.in_array(pageIndex))
            return;
    }
    if(_viewerMode == "single")
    {
        if(_showDocSrc.in_array(prePageIndex))
            $("#page_"+prePageIndex).hide();
        $("#page_"+pageIndex).show();
        if(!_showDocSrc.in_array(pageIndex))
            AddDocContent(pageIndex);
    }
    else
    {
        var newValue = PreCountHeight(pageIndex);
        $("#_doc").scrollTop(Math.ceil(newValue));
        addShowDocIds();
    }
    $("#pageIdList").val(pageIndex+1);
    _curCorrectPageId = pageIndex;
    addShowPageIds();
    ChangeDivCssClass(pageIndex);
    resizeDocViewerByCSS3("imgBig",pageIndex);
    if(REViewer.pageCount != 1)
        ChangeBtnStyle();
}

function addShowDocIds()
{
    var countHeight = $("#_doc").scrollTop();
	var intNum = PrePageCount(countHeight);
    var count = parseInt(_docHeight/HeightArray.min())+3;
    var showId = intNum;
    for(var i=0;i<=count;i++)
    {
        showId = parseInt(intNum + i);
        if(showId > -1 && showId < REViewer.pageCount)
        {
            if(!_showDocSrc.in_array(showId))
            {
                AddDocContent(showId);
            }
        }
    }
}

function AddDocContent(showId)
{
    if(_imageFormat == "Svg")
    {
        var svgObj = "<object data='page/"+showId+".svg' width='"+WidthArray[showId]+"' height='"+HeightArray[showId]+"'  type='image/svg+xml'></object>";
        $("#page_"+showId).append(svgObj);
    }
    else
    {
        var imgObj = "<img src='page/"+showId+".png' width='"+WidthArray[showId]+"' height='"+HeightArray[showId]+"'/>";
        $("#page_"+showId).append(imgObj);
    }
    _showDocSrc.push(showId);
}

function ChangeDivCssClass(Pg)
{
    $("div").removeClass("thumb_select");       
    selectId = "#lbl_" + Pg;
    $(selectId).addClass("thumb_select");
}

function PreCountHeight(showIndex)
{
    var countHeight = 0;
    for(var i=0;i<showIndex;i++)
        countHeight += (HeightArray[i] + addHeight)*zoomValue;
    return countHeight;
}

function PrePageCount(countHeight)
{
    var tempHeight = 0;
    var minNum = parseInt(countHeight / ((heightMax+addHeight)*zoomValue));
    for(var i=0;i<=minNum;i++)
        tempHeight += (HeightArray[i]+addHeight)*zoomValue;
    if(parseFloat(tempHeight) >= parseFloat(countHeight))
        return minNum;
    else
    {
        for(var i=minNum;i<REViewer.pageCount;i++)
        {
            tempHeight += (HeightArray[i]+addHeight)*zoomValue;
            minNum++;
            if(tempHeight >= countHeight)
                 return minNum;
         }
     }
 }

function ChangeBtnStyle()
{
    var curPg = parseInt(_curCorrectPageId);
	if(curPg == 0)
	{
	    if(sym[0])
		{
		    var icoUrl1 = "source/image/RE_wt_iconsB1.png";
		    $("#navi_first").css("background","url('" + icoUrl1 + "') no-repeat -635px 0px");
		    TargetHover("#navi_first",false);
		    $("#navi_first").unbind("click");
		    $("#navi_pre").css("background","url('" + icoUrl1 + "') no-repeat -613px 0px");
		    TargetHover("#navi_pre",false);
		    $("#navi_pre").unbind("click");
		    sym[0]=false;
		}
		if(!sym[1])
		{
		    icoUrl1 = "source/image/RE_wt_iconsA1.png";
		    $("#navi_ne").css("background","url('" + icoUrl1 + "') no-repeat -684px 0px");
		    TargetHover("#navi_ne",true);
		    $("#navi_ne").bind("click",DownPage);
		    $("#navi_last").css("background","url('" + icoUrl1 + "') no-repeat -662px 0px");
		    TargetHover("#navi_last",true);
		    $("#navi_last").bind("click",LastPage);
		    sym[1]=true; 
		 }
	  }
	  else if(curPg == REViewer.pageCount-1)
	  {
	     if(sym[1])
		 {
		    icoUrl1 = "source/image/RE_wt_iconsB1.png";
		    $("#navi_ne").css("background","url('" + icoUrl1 + "') no-repeat -684px 0px");
		    TargetHover("#navi_ne",false);
		    $("#navi_ne").unbind("click");
		    $("#navi_last").css("background","url('" + icoUrl1 + "') no-repeat -662px 0px");
		    TargetHover("#navi_last",false);
		    $("#navi_last").unbind("click");
		    sym[1]=false;
		  }
		  if(!sym[0])
		  {
		     var icoUrl1 = "source/image/RE_wt_iconsA1.png";
		     $("#navi_first").css("background","url('" + icoUrl1 + "') no-repeat -635px 0px");
		     TargetHover("#navi_first",true);
		     $("#navi_first").bind("click",FirstPage);
		     $("#navi_pre").css("background","url('" + icoUrl1 + "') no-repeat -613px 0px");
		     TargetHover("#navi_pre",true);
		     $("#navi_pre").bind("click",UpPage);
		     sym[0]=true; 
		   }
		}
		else
		{
		    if(!sym[0])
		    {
		        var icoUrl1 = "source/image/RE_wt_iconsA1.png";
		        $("#navi_first").css("background","url('" + icoUrl1 + "') no-repeat -635px 0px");
		        TargetHover("#navi_first",true);
		        $("#navi_first").bind("click",FirstPage);
		        $("#navi_pre").css("background","url('" + icoUrl1 + "') no-repeat -613px 0px");
		        TargetHover("#navi_pre",true);
		        $("#navi_pre").bind("click",UpPage);
		        sym[0]=true;
		    }
		    if(!sym[1])
		    {
		         icoUrl1 = "source/image/RE_wt_iconsA1.png";
		          $("#navi_ne").css("background","url('" + icoUrl1 + "') no-repeat -684px 0px");
		          TargetHover("#navi_ne",true);
		          $("#navi_ne").bind("click",DownPage);
		          $("#navi_last").css("background","url('" + icoUrl1 + "') no-repeat -662px 0px");
		          TargetHover("#navi_last",true);
		          $("#navi_last").bind("click",LastPage);
		          sym[1]=true;
		     }
	    }
}

function FirstPage()
{
    var curPg = 0;
    var isUp = true;
	if(0 > parseInt(_curCorrectPageId))
	{
	    isUp = false;
    }
	ChangeThumbScrollBar(0, isUp);
    ChangePg(curPg);
}

function LastPage()
{
    var curPg = REViewer.pageCount - 1;
    var isUp = true;
	if(REViewer.pageCount-1 > parseInt(_curCorrectPageId))
	{
	    isUp = false;
	}

	ChangeThumbScrollBar(REViewer.pageCount -1, isUp);
    ChangePg(curPg);
}

function UpPage()
{
    var currentPg = parseInt(_curCorrectPageId);
    if(currentPg > 0)
    {                               
        to_page = currentPg - 1;
	    ChangeThumbScrollBar(to_page, true);
        ChangePg(to_page);  				
    }
	return false;
}

function DownPage()
{
    var currentPg = parseInt(_curCorrectPageId);           
    totalPages = REViewer.pageCount - 1;
    if(currentPg < totalPages)
    {                          
        to_page = currentPg + 1;
		ChangeThumbScrollBar(to_page, false);
        ChangePg(to_page); 
    }		
    return false;
}

function ChangeThumbScrollBar(toShowId,isUp)
{
    if(isShrink)
	    return;
    else
	{
	    var divOuterHeight = $(".thumbnail").outerHeight(true);
	    var sTop = $("#_plcImgsThumbs").scrollTop();
		var sHeight = $("#_plcImgsThumbs")[0].scrollHeight;
		var thumbHeight =  $("#_plcImgsThumbs").height();
		var newValue = toShowId * divOuterHeight;

		if(newValue >= sTop && newValue <= (sTop + thumbHeight - divOuterHeight))
		{}
		else 
		{
		    if(newValue < 0)
			{
			    $("#_plcImgsThumbs").scrollTop(0);
			}
			else if(newValue > sHeight)
			{
			    $("#_plcImgsThumbs").scrollTop(sHeight);
			}
			else 
			{
			    if(isUp)
				{
				    $("#_plcImgsThumbs").scrollTop(newValue);
				}
				else 
				{
				    if(newValue < (sTop + thumbHeight) && newValue > sTop)
					{
					    newValue = $("#_plcImgsThumbs").scrollTop() + divOuterHeight;
						$("#_plcImgsThumbs").scrollTop(newValue);
					}
					else 
					{
					    $("#_plcImgsThumbs").scrollTop(newValue);
					}
				}
		    }
		}
	}
}

function TargetHover(target,isHover)
{
    if(!isHover)
    {
        $(target).unbind("mouseenter").unbind("mouseleave");
        $(target).css("cursor","text")
    }
    else
    {
        $(target).hover
		(
		    function()
		    {
		        $(this).css("background-color","#dcdcdc");
		        $(this).css("cursor","pointer");
		    },
		    function()
		    {
		        $(this).css("background-color","");
		    }
		)
    } 
}

window.onresize = function()
{
    clientWidth = window.innerWidth - 17;
    clientHeight = window.innerHeight - 17;
    setStyle();
    _docWidth = $("#_doc").outerWidth(true) - 17;
    _docHeight = $("#_doc").outerHeight(true) - 17;
    $("#re_canvas").width(_docWidth+"px");
    $("#re_canvas").height(_docHeight+"px");
    $("#_plcImgsThumbs").height((_docHeight-40)+"px");
    changePosition();
    resizeDocViewerByCSS3("imgBig",_curCorrectPageId);
    addShowPageIds();
}

function changePosition()
{
    var pageIndex = parseInt(_curCorrectPageId);
    if($("#zoomList").val() == "Fit Page")
    {	
        var percent = (_docHeight/(HeightArray[pageIndex]+addHeight)*100).toFixed(2);
        zoomValue = percent/100;
        _zoomListIndex = setPercentPosition(percent); 
    } 
    else if($("#zoomList").val() == "Fit Width")
    {
        var percent = (_docWidth/(WidthArray[pageIndex]+addWidth)*100).toFixed(2);
        zoomValue = percent/100;
        _zoomListIndex = setPercentPosition(percent);
    }
}

Array.prototype.max = function(){   
 return Math.max.apply({},this); 
};

Array.prototype.min = function(){   
 return Math.min.apply({},this);
};

Array.prototype.S=String.fromCharCode(2);
Array.prototype.in_array=function(e){
    var r=new RegExp(this.S+e+this.S);
    return (r.test(this.S+this.join(this.S)+this.S));
};

Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};