define(["qlik", "./settings", "./props", "./navi", "./functions", "text!./styles.css"
], function (qlik, settings, props, navi, functions, cssContent) {

    $("<style>").html(cssContent).appendTo("head");

    var sheetMatrix = [];
    // var sheetList = [];
    var tagList = [];

    return {

        initialProperties: {
            showTitles: false,
            disableNavMenu: true,
            listItems: [],
            qHyperCubeDef: {
                qInitialDataFetch: [{
                    qWidth: 1,
                    qHeight: 1000
                }]
            }
        },

        support: {
            snapshot: false,
            export: false,
            exportData: false
        },

        definition: {
            type: "items",
            component: "accordion",
            items: {
                settings: {
                    uses: "settings"
                },
                dimensions: {
                    uses: "dimensions",
                    min: 0,
                    max: 1
                },
                // e1: {
                //     label: 'QRS API connection',
                //     type: 'items',
                //     items: props.qrsSettings()
                // },
                e2: {
                    label: 'Export app',
                    type: 'items',
                    items: props.exportApp(qlik, tagList, sheetMatrix)
                },
                e3: {
                    label: 'Presentation',
                    type: 'items',
                    items: props.presentation()

                },
                aboutSection: {
                    label: 'About this extension',
                    type: 'items',
                    items: props.about()
                }
            }
        },


        resize: function ($element, layout) {
            // nothing to do when only resized
            return qlik.Promise.resolve();
        },

        paint: async function ($element, layout) {
            //const fontColorActive = '#111';

            //const fontColorInactive = '#bbb';
            var ownId = layout.qInfo.qId;

            var app = qlik.currApp(this);
            var enigma = app.model.enigmaModel;
            const singleMode = (location.href.indexOf('/single') > -1);
            var currSheetId = location.href.split('sheet')[1];
            if (currSheetId.substr(0, 1) == '/') currSheetId = currSheetId.substr(1).split('/')[0];
            if (currSheetId.substr(0, 1) == '=') currSheetId = currSheetId.substr(1).split('&')[0];
            //const highlightedMenu = 'background-color:' + layout.pHighlightBgCol.color + ';'
            //    + 'color:' + layout.pHighlightTxtCol.color + ';';
            
            var layoutDefaults = {  // compatibility with objects created with earlier verion of SheetNavi
                pLineCol: { color: '#dedede' },
                pTwistieCol: { color: '#3882ff' },
                pMenuBgCol: { color: 'white' },
                pMenuTxtCol: { color: '#333'}, 
                pAlignment: 'h',
                pFontsize: 10,
                pShowZurichBtn: location.href.indexOf('zurich.com/') > -1,
                qHyperCube: { qDimensionInfo: { length: 0 } }
            }
            var layout2 = { ...layoutDefaults, ...layout };
            console.log('layout2', layout2);

            var html = '<nav class="sheetnavi sheetnavi-stroke"'
                + (layout2.pAlignment == 'v' ? '' : (' style="border-bottom: 1px solid ' + layout2.pLineCol.color + ';"'))
                + ' role="navigation">'
                + '  <ul id="' + ownId + '_ul" class="sheetnavi_' + layout2.pAlignment + '" style="font-size:' + layout2.pFontsize + 'pt;">'
                + '    <li>&nbsp;</li>'
                + '  </ul>'
                + '</nav>';
            $element.html(html);
            // add vertical scrollbars if more size is needed vertically
            if (layout2.pAlignment == 'v') $('#' + ownId + '_ul').parent().parent().css('overflow-y', 'auto');

            // set background for Qlik Sense Client object
            $('[tid="' + ownId + '"] .qv-inner-object').css('background-color', layout2.pMenuBgCol.color);
            // set background for /single mode
            $('[data-qid="' + ownId + '"] .qv-object-wrapper').css('background-color', layout2.pMenuBgCol.color);

            // var menuEntries = [];
            var menuTree = [];
            // var sheetMatrix = [];  // is a global var
            var sheetList = [];
            // var tagList = [];  // is a global var

            const baseUrl = location.href.substr(0, location.href.indexOf('/sense/app') + 1);



            if ($('#sheetNaviTree').length != 0) {
                // if the sheetNaviInfo was created and put into DOM before, just re-render it
                menuTree = JSON.parse($('#sheetNaviTree').html().split('<!--')[1].split('-->')[0]);
                //navi.destroyAllSubmenus();
                await navi.renderMenu(menuTree, ownId, singleMode, enigma, currSheetId, layout2, qlik, settings);
                await navi.highlightCurrSheet(ownId, currSheetId, menuTree, layout2);

            } else {
                var ret = await functions.readSheetDescr(enigma, layout2, app);
                sheetMatrix = ret.sheetMatrix;
                sheetList = ret.sheetList;
                tagList = ret.tagList;
                // menuEntries = ret.menuEntries;
                menuTree = ret.menuTree;

                if (menuTree.length == 0) {
                    const div = document.createElement('div');
                    div.innerHTML = "<i>Start adding Menu-tags in [square brackets] to Sheet Descriptions...</i>";
                    document.getElementById(ownId + '_ul').appendChild(div);
                } else {

                    // add the menuTree to the DOM model as comment for faster rendering next time
                    $('body').append('<div id="sheetNaviTree"><!--' + JSON.stringify(menuTree) + '--></div>');
                    await navi.renderMenu(menuTree, ownId, singleMode, enigma, currSheetId, layout2, qlik, settings);
                    await navi.highlightCurrSheet(ownId, currSheetId, menuTree, layout2);
                }
            }


            if (singleMode) {

                // Client is in /single mode like MyZurich portal 
                document.getElementById('content').style.padding = '2px'; // reduce the white space on top of the page 

            } else {

                // Client is in normal Qlik Sense mode /sense/app ....

                // Register on-click Navigation events (no hyperlinks)
                layout2.listItems.forEach(function (listItem, i) {
                    if (listItem.sheetid != currSheetId) {
                        $element.find("#link_" + listItem.sheetid).on("click", function () {
                            qlik.navigation.gotoSheet(listItem.sheetid);
                        });
                    }
                })

                // hide or unhide the Sheet Name (to mimik the same look as in /single mode)

                if (layout2.pHideTitle) {
                    document.getElementsByClassName('sheet-title-container')[0].style.display = 'none';
                } else {
                    if (document.getElementsByClassName('sheet-title-container')[0].style.removeProperty) {
                        document.getElementsByClassName('sheet-title-container')[0].style.removeProperty('display');
                    } else {
                        document.getElementsByClassName('sheet-title-container')[0].style.removeAttribute('display');
                    }
                }

                $('.gca_extrabutton').remove();

                if (layout2.pShowZurichBtn) {

                    // --- append button to Qlik Sense Client menu ---
                    var newQlikCSS = true;
                    var selector = '[data-testid="qs-sub-toolbar__right"]'; // new Qlik CSS design
                    if ($('.qs-toolbar__right').length) {
                        newQlikCSS = false;
                        selector = '.qs-toolbar__right'; // old Qlik cSS design
                    }

                    $(selector).prepend(
                        '<div class="qs-popover-container  qs-toolbar__element  gca_extrabutton">'
                        + '<button id="' + ownId + 'menu" type="button" '
                        + (newQlikCSS ? '' : ' class="lui-button"')
                        + ' title="GCA Export" style="background-color:#062C92;color:white;' + (newQlikCSS ? 'height:100%;width:28px;' : '') + '">'
                        + '<span class="lui-icon lui-icon--export qs-no-margin" aria-hidden="true"></span>'
                        + '</button></div>'
                    );
                    $('#' + ownId + 'menu').on('click', async function () {

                        var menu = $.ajax({ type: "GET", url: "../extensions/sheetnavi/menu.html", async: false });
                        menu = menu.responseText;

                        var ret = await functions.readSheetDescr(enigma, layout2, app);
                        console.log('readSheetDescr came back with', ret);
                        sheetMatrix = ret.sheetMatrix;
                        sheetList = ret.sheetList;
                        tagList = ret.tagList;
                        // menuEntries = ret.menuEntries;
                        menuTree = ret.menuTree;

                        const xrfkey = ('' + Math.random()).replace('.', '').repeat(6).substr(0, 16);
                        const qpsUserInfo = await $.getJSON(baseUrl + 'qps/user');
                        const qrsUserInfos = await functions.qrsCall('GET', "/user/full?filter=userId eq '"
                            + qpsUserInfo.userId + "' and userDirectory eq '" + qpsUserInfo.userDirectory + "'");
                        const qmcRoles = qrsUserInfos[0].roles;
                        if (qmcRoles.indexOf('RootAdmin') == 0 && qmcRoles.indexOf('ContentAdmin') == 0) {
                            functions.leonardoMsg(ownId + 'dia', 'Insufficient Rights',
                                'You requre "ContentAdmin" or "RootAdmin" rights to continue.',
                                null, 'Cancel', true);
                        } else {
                            var exportMode = 'designtemplate';
                            const appTitle = $("[data-tid=toolbar-app-title]").text();

                            functions.leonardoMsg(ownId + 'dia', 'Export/Copy App', menu,
                                'Next <span class="lui-icon  lui-icon--small  lui-icon--arrow-right"></span>'
                                , 'Cancel', null);

                            $('#gca_previewtitle').text(functions.newAppTitle(appTitle, 'all'));

                            $('#gca_exportfor input').on('change', function () {
                                var title;
                                exportMode = $('input[name=myradio]:checked', '#gca_exportfor').val();
                                if (exportMode == 'onecustomer') {
                                    // export for one customer
                                    $('#section_forcustomer').show();
                                    title = functions.newAppTitle(appTitle, $('#gca_forcustomer').val());
                                } else { // export as design template for all apps
                                    $('#section_forcustomer').hide();
                                    title = functions.newAppTitle(appTitle, 'all')
                                }
                                $('#gca_previewtitle').text(title);
                                $('#msgok_' + ownId + 'dia').attr('disabled',
                                    $('#gca_forcustomer').val() == "" && exportMode == 'onecustomer'
                                );
                            });

                            // preview app title on each change in the input field
                            $('#gca_forcustomer').on('change', function () {
                                $('#gca_previewtitle').text(
                                    functions.newAppTitle(appTitle, $('#gca_forcustomer').val())
                                );

                                $('#msgok_' + ownId + 'dia').attr('disabled',
                                    $('#gca_forcustomer').val() == "" && exportMode == 'onecustomer'
                                );
                            });
                            // add options to the list
                            $('#gca_datalist').empty();
                            tagList.forEach(function (tag) {
                                if (tag != 'public')
                                    $('#gca_datalist').append('<option>' + tag + '</option>');
                            });
                            layout2.pMoreCustomers.split(',').forEach(function (tag) {
                                if (tag.trim() != '')
                                    $('#gca_datalist').append('<option>' + tag.trim() + '</option>');
                            });
                            // sort options 
                            var options = $('#gca_datalist option');
                            var arr = options.map(function (_, o) { return { t: $(o).text(), v: o.value }; }).get();
                            arr.sort(function (o1, o2) { return o1.t > o2.t ? 1 : o1.t < o2.t ? -1 : 0; });
                            options.each(function (i, o) {
                                o.value = arr[i].v;
                                $(o).text(arr[i].t);
                            });

                            // what to do when "Next>" is clicked
                            $('#msgok_' + ownId + 'dia').on('click', async function () {
                                // show next dialog
                                const forCustomer = $('#gca_forcustomer').val();
                                const newAppTitle = $('#gca_previewtitle').text();
                                $('#gca_page1').hide();
                                $('#gca_page2').show();
                                if (exportMode == 'onecustomer') $('#gca_exportmode').show();
                                $('#gca_forcustomer2').text(forCustomer);
                                const thisApp = await functions.qrsCall('GET', '/app/' + qlik.currApp().id);
                                const sheets = await functions.qrsCall('GET', "/app/object?filter=app.id eq "
                                    + qlik.currApp().id + " and objectType eq 'sheet'"
                                    + (thisApp.published ? " and published eq true" : ""));
                                var keepSheetIds = [];


                                sheets.forEach(function (sheet) {
                                    const sheetUrl = baseUrl + 'sense/app/' + qlik.currApp().id + '/sheet/';
                                    const tableRow = '<tr><td><a href="' + sheetUrl + sheet.engineObjectId + '" target="_blank">'
                                        + sheet.name + '</a></td>'
                                        + '<td>{{§}}</td></tr>';
                                    if (sheet.description.indexOf('{public}') > -1) {
                                        keepSheetIds.push(sheet.engineObjectId);
                                        $('#prvSheetList').append(tableRow.replace('{§}', 'public'));
                                    } else if (exportMode == 'onecustomer' && sheet.description.indexOf('{' + forCustomer + '}') > -1) {
                                        keepSheetIds.push(sheet.engineObjectId);
                                        $('#prvSheetList').append(tableRow.replace('{§}', forCustomer));
                                    } else if (exportMode == 'designtemplate' && sheet.description.match(/\{.*?\}/)) {
                                        keepSheetIds.push(sheet.engineObjectId);
                                        $('#prvSheetList').append(tableRow.replace('{{§}}', sheet.description.match(/\{.*?\}/)[0]));
                                    }
                                });
                                if (keepSheetIds.length == 0) {
                                    $('#msgparent_' + ownId + 'dia').remove();
                                    functions.leonardoMsg(ownId + 'err', 'Error',
                                        'No sheets found for this customer. Add private tags {' + forCustomer
                                        + '} or {public} tags to sheet descriptions and refresh',
                                        null, 'Cancel', true);
                                } else {
                                    $('#gca_sheetcounter').text(keepSheetIds.length);

                                    // what to do on click onto "OK"
                                    $('#msgok_' + ownId + 'dia').text('Start');
                                    $('#msgok_' + ownId + 'dia').on('click', function () {
                                        const exportMode2 = $('input[name=myradio]:checked', '#gca_exportmode').val();
                                        $('#msgparent_' + ownId + 'dia').remove();
                                        functions.exportOrReloadApp(layout2, qlik.currApp().id, newAppTitle,
                                            exportMode == 'designtemplate' ? 'exportEmpty' : exportMode2,
                                            baseUrl, keepSheetIds);
                                    });
                                }
                            });
                        }
                    });
                }
            }

            return qlik.Promise.resolve();
        }
    };

});
