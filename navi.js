define(['jquery'], function ($) {


    function widthOfText(myText, myStyle) {
        // lets the browserrender a text in a span and return the pixel width
        const text = document.createElement("span");
        document.body.appendChild(text);
        text.id = 'tempContentText';
        text.style = myStyle;
        text.style.height = 'auto';
        text.style.width = 'auto';
        text.style.position = 'absolute';
        text.style.whiteSpace = 'no-wrap';
        text.innerHTML = myText;
        const width = Math.ceil(text.clientWidth);
        document.body.removeChild(text);
        return (width);
    }

    //-------------------------------------------------------------------------------------
    function showSubmenu(divId) {
        // hide all other possibly open submenus first
        const subMenus = document.getElementsByClassName("absoluteSubMenu");
        subMenus.forEach(function (subMenu) {
            subMenu.style.display = 'none';
            const spanSel = '#' + subMenu.id.replace('subMenu', '') + ' span';
            try {
                document.querySelector(spanSel).classList.remove('rotate180');
            } catch (err) { }
        });

        var pos = document.getElementById(divId).parentElement.getBoundingClientRect();
        var subMenu = document.getElementById(divId + 'subMenu');
        var effectiveHeight = document.getElementById(divId + 'subMenu').firstChild.getBoundingClientRect().height;
        const maxWidth = parseInt(subMenu.getAttribute('maxwidth')) * 1.2 + 20;
        subMenu.style.left = (pos.x + pos.width / 2 - maxWidth / 2) + "px";
        subMenu.style.top = (pos.y + pos.height + 2) + "px";
        subMenu.style.width = maxWidth /*pos.width*/ + "px";
        subMenu.style.height = effectiveHeight + "px";
        subMenu.style.display = "block";
        document.querySelector('#' + divId + ' span').classList.add('rotate180');
    }

    //-------------------------------------------------------------------------------------
    function gotoSheet(sheetId, singleMode, enigma, currSheetId, layout, qlik, settings) {
        if (sheetId != currSheetId) {
            // navigates to another sheet. It differentiates between singleMode (opened with url 
            // like/single?appid=<appid>&...) and full Sense lient (url like /sense/app/<appid>/...)
            destroyAllSubmenus();
            console.log('gotoSheet', sheetId, singleMode);
            if (singleMode) {
                // now parse the current selection into query string parameters and redirect the browser
                enigma.evaluate(settings.currSelectionsFormula).then(function (res) {
                    var selections = res.length <= 1 ? '' : '&select=' + encodeURIComponent(res).replace(/%0A/g, '&select=').replace(/%2C/g, ',');
                    // add more query-strings if configured in the extension
                    window.location = location.href.replace(currSheetId, sheetId).split('&select=')[0] + selections + '&' + layout.pMoreQueryStrings;
                });
            } else {
                qlik.navigation.gotoSheet(sheetId);
            }
        }
    }

    //-------------------------------------------------------------------------------------
    function createSubmenu(divId, children, singleMode, enigma, currSheetId, layout, qlik, settings) {
        var pos = document.getElementById(divId).parentElement.getBoundingClientRect();
        //console.log('position of "#' + divId + '"', pos);
        $('#' + divId + "subMenu").remove(); // if already in the DOM, remove it first

        var subMenu = document.createElement("div");

        var html = '<nav class="sheetnavi sheetnavi-stroke menushadow" style="background-color:' + layout.pMenuBgCol.color + ';">'
            + '<ul id="' + divId + '_childs_ul" class="sheetnavi_' + layout.pAlignment + '" style="font-size:' + layout.pFontsize + 'pt;">'
            + '</ul>'
            + '</nav>';
        subMenu.innerHTML = html;
        subMenu.id = divId + "subMenu";
        subMenu.className = "absoluteSubMenu";
        subMenu.style = "display:none;"
        //subMenu.style = "z-index:500;display:none;position:absolute;background-color:rgba(0,0,0,0);"  // moved to .css
        //subMenu.onmouseout = function() {console.log("OUT");}
        document.body.appendChild(subMenu);
        //document.getElementById(divId + 'close').onclick = function () { hideSubmenu(divId); };
        var maxWidth = 0;
        children.forEach(function (child, i) {
            var li = '<li class="absoluteSubMenuEntry" style="background-color:' + ';width:100%;padding-top:5px;">'
            li += '<a id="' + divId + '_child' + i + '">' + child.menu + '</a>';
            li += '</li>'
            $('#' + divId + '_childs_ul').append(li);
            maxWidth = Math.max(maxWidth, widthOfText(child.menu, 'font-family:"QlikView Sans";font-size:' + layout.pFontsize + 'pt;font-weight:bold;'));

            /*
            var li = document.createElement('li');
            //li.style = "background:#fff;width:100%;padding-top:5px;";
            li.className = "absoluteSubMenuEntry"
            //console.log('width of '+child.menu, widthOfText(child.menu, 'font-family:"QlikView Sans";font-size:14px;'));
            maxWidth = Math.max(maxWidth, widthOfText(child.menu, 'font-family:"QlikView Sans";font-size:14px;font-weight:bold;'));
            li.innerHTML = '<a id="' + divId + '_child' + i + '">' + child.menu + '</a>';
            document.getElementById(divId + '_childs_ul').appendChild(li);
            */
            //console.log(document.getElementById(divId + '_child' + i));
            document.getElementById(divId + '_child' + i).addEventListener("click", function () {
                gotoSheet(child.link, singleMode, enigma, currSheetId, layout, qlik, settings);
            });
        })
        subMenu.setAttribute('maxwidth', maxWidth);
    }


    //-------------------------------------------------------------------------------------
    function toggleSubmenu(divId) {
        var subMenu = document.getElementById(divId + 'subMenu');
        if (subMenu.style.display == 'none') {
            showSubmenu(divId)
        } else {
            hideSubmenu(divId, 0);
        }
    }

    //-------------------------------------------------------------------------------------
    function hideSubmenu(divId, e) {
        console.log('hiding subMenu ' + divId, e);
        document.getElementById(divId + 'subMenu').style.display = "none";
        //document.querySelector('#' + divId + ' span').classList.remove('lui-icon--arrow-up');
        document.querySelector('#' + divId + ' span').classList.remove('rotate180');
        //document.querySelector('#' + divId + ' span').classList.add('lui-icon--arrow-down');
        //const e = document.getElementById("subMenu"+divId);
        //if (e) e.parentElement.removeChild(e);
    }

    //-------------------------------------------------------------------------------------
    function destroyAllSubmenus() {
        console.log('remove all subMenus');
        var paras = document.getElementsByClassName('absoluteSubMenu');
        while (paras[0]) {
            paras[0].parentNode.removeChild(paras[0]);
        }
    }

    async function getSheetLinksFromDim(layout, enigma, ownId) {

        var allowedSheets = [];
        var moreLinks = [];
        if (layout.qHyperCube.qDimensionInfo.length > 0) {
            for (const dataRow of layout.qHyperCube.qDataPages[0].qMatrix) {
                var newElem = layout.pSplitChar == '' ? [dataRow[0].qText] : dataRow[0].qText.split(layout.pSplitChar)
                newElem = newElem.map(function (s) { return s.trim() })
                allowedSheets = allowedSheets.concat(newElem);
            }
            if (layout.pConsoleLog) console.log(ownId + ' allowedSheets', allowedSheets);

            const sessObj = await enigma.createSessionObject({
                qInfo: {
                    qType: "SheetList"
                },
                qAppObjectListDef: {
                    qType: "sheet",
                    qData: {
                        title: "/qMetaDef/title",
                        description: "/qMetaDef/description",
                        labelExpression: "/labelExpression/qStringExpression/qExpr",
                        showCondition: "/showCondition",
                        //"thumbnail": "/thumbnail",
                        //"cells": "/cells",
                        rank: "/rank"
                        //"columns": "/columns",
                        //"rows": "/rows"
                    }
                }
            });
            const sheetList = await sessObj.getLayout();
            // sort list
            function fnSort(a, b) {
                return ((a.qData.rank < b.qData.rank) ? -1 : ((a.qData.rank > b.qData.rank) ? 1 : 0));
            }
            sheetList.qAppObjectList.qItems.sort(fnSort);

            //sheetList.qAppObjectList.qItems.forEach(async function (sheetDef, i) {
            for (const sheetDef of sheetList.qAppObjectList.qItems) {
                const addSheet = layout.qHyperCube.qDimensionInfo.length > 0 ? allowedSheets.indexOf(sheetDef.qMeta.title) >= 0 : true;
                if (layout.pConsoleLog) console.log(ownId, sheetDef.qData, sheetDef.qInfo.qId, sheetDef.qInfo.qId == thisSheetId, addSheet);
                var title = sheetDef.qMeta.title;
                if (sheetDef.qData.labelExpression != '') title = await enigma.evaluate(sheetDef.qData.labelExpression);
                if (addSheet) {
                    //linksFound++;
                    moreLinks.push({ menu: title, link: sheetDef.qInfo.qId });
                    //console.log('Add sheet', sheetDef);
                }
            };
        }

        return moreLinks
    }

    return {
        //-------------------------------------------------------------------------------------
        destroyAllSubmenus: function () {
            destroyAllSubmenus();
        },

        //-------------------------------------------------------------------------------------
        highlightCurrSheet: async function (ownId, currSheetId, navDef, layout) {

            navDef.forEach(function (menuDef) {
                if (menuDef.link == currSheetId) {
                    $('#' + ownId + menuDef.id).parent()
                        .css('color', layout.pHighlightTxtCol.color)
                        .css('background-color', layout.pHighlightBgCol.color);
                    $('#' + ownId + menuDef.id)
                        .css('cursor', 'default');
                    //document.getElementById(ownId + menuDef.id).parentElement.style = highlightStyle;
                    //document.getElementById(ownId + menuDef.id).style = "cursor:default;";
                }
                if (menuDef.hasOwnProperty('children')) {
                    menuDef.children.forEach(function (menuDefChild, i) {
                        if (menuDefChild.link == currSheetId) {
                            $('#' + ownId + menuDef.id).parent()
                                .css('color', layout.pHighlightTxtCol.color)
                                .css('background-color', layout.pHighlightBgCol.color);
                            $('#' + ownId + menuDef.id + '_child' + i).parent()
                                .css('color', layout.pHighlightTxtCol.color)
                                .css('background-color', layout.pHighlightBgCol.color);
                            $('#' + ownId + menuDef.id + '_child' + i)
                                .css('cursor', 'default');
                            //document.getElementById(ownId + menuDef.id).parentElement.style = highlightStyle;
                            //document.getElementById(ownId + menuDef.id + '_child' + i).parentElement.style = highlightStyle;
                            //document.getElementById(ownId + menuDef.id + '_child' + i).style = "cursor:default;"
                        }
                    })
                }
            })
            return true
        },




        //--------------------------------------------------------------------------------------
        renderMenu: async function (navDef, ownId, singleMode, enigma, currSheetId, layout, qlik, settings) {

            var moreLinks = await getSheetLinksFromDim(layout, enigma, ownId);
            if (moreLinks.length > 0) {
                navDef.push({
                    "menu": layout.qHyperCube.qDimensionInfo[0].qFallbackTitle,
                    "id": navDef.length,
                    "link": null,
                    "title": null,
                    "children": moreLinks
                });
            }
            // console.log('moreLinks', moreLinks, navDef);

            $('#' + ownId + '_ul').empty();
            navDef.forEach(function (menuDef) {
                var li = '<li style="margin-bottom:' + layout.pHeight + 'px;color:' + layout.pMenuTxtCol.color + '">'
                    + '<a id="' + ownId + menuDef.id + '">'
                    + menuDef.menu + (menuDef.hasOwnProperty('children') ?
                        '<span style="color:' + layout.pTwistieCol.color +
                        '; transition: ease 0.4s;-webkit-transition: ease 0.4s;" class="lui-icon  lui-icon--arrow-down"></span>' : '')
                    + '</a>'
                    + '</li>';
                $('#' + ownId + '_ul').append(li);
                /*
                var li = document.createElement('li');
                li.innerHTML = '<a id="' + ownId + menuDef.id + '">'
                    + menuDef.menu + (menuDef.hasOwnProperty('children') ?
                        '<span style="color:' + layout.pTwistieCol.color +
                        '; transition: ease 0.4s;-webkit-transition: ease 0.4s;" class="lui-icon  lui-icon--arrow-down"></span>' : '')
                    + '</a>';
                document.getElementById(ownId + '_ul').appendChild(li);
                */
                if (menuDef.hasOwnProperty('children')) {
                    createSubmenu(ownId + menuDef.id, menuDef.children, singleMode, enigma, currSheetId, layout, qlik, settings);
                    document.getElementById(ownId + menuDef.id).addEventListener("click", function () {
                        toggleSubmenu(ownId + menuDef.id)
                    });

                } else {
                    document.getElementById(ownId + menuDef.id).addEventListener("click", function () {
                        gotoSheet(menuDef.link, singleMode, enigma, currSheetId, layout, qlik, settings);
                    });
                }
            });

            try {
                if (window.location !== window.parent.location) {
                    const res = await enigma.evaluate(settings.currSelectionsFormula)
                    var selections = res.length <= 1 ? '' : '&select='
                        + encodeURIComponent(res).replace(/%0A/g, '&select=').replace(/%2C/g, ',');
                    parent.postMessage(selections, '*');

                    /*enigma.evaluate(settings.currSelectionsFormula).then(function (res) {
                        var selections = res.length <= 1 ? '' : '&select='
                            + encodeURIComponent(res).replace(/%0A/g, '&select=').replace(/%2C/g, ',');
                        parent.postMessage(selections, '*');
                    })
                    */
                }
            }
            catch (err) { };

            // Add Logout button 
            if (layout.pShowLogout && location.pathname.indexOf('/single') > -1) {
                const vproxy = location.pathname.split('/single')[0];
                if ($('#logmeout').length == 0) {
                    // append the Logout button to the CurrentSelection Panel
                    $('#CURRSELPANEL .buttons-end').append('<div id="logmeout" class="qv-subtoolbar-button  borderbox" '
                        + 'tabindex="0" title="Logout" style="border-left: 1px solid grey;" aria-hidden="true">'
                        + '<i class="lui-icon lui-icon--log-out icon"></i></div>');
                }
                $('#logmeout').on('click', function () {
                    var xhr = new XMLHttpRequest();
                    xhr.withCredentials = true;
                    xhr.addEventListener("readystatechange", function () {
                        if (this.readyState === 4) {
                            $('#qv-stage-container').html('<div style="position:absolute;top:0;left:0;width:100%;height:100%;">'
                                + '<div style="height:100%;width:100%;display:table;">'
                                + '<div style="vertical-align:middle;text-align:center;height:100%;display:table-cell;font-family:Arial,Helvetica,sans-serif;">'
                                + 'Session closed.</div></div></div>');
                        }
                    });
                    xhr.open("DELETE", vproxy + "/qps/user");
                    //		xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send();
                })
            }
            return true
        }


    }
})