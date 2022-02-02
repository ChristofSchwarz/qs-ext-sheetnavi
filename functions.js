define([], function () {
    return {

        //=============================================================================================
        leonardoMsg: function (ownId, title, detail, ok, close, inverse) {
            //=========================================================================================
            leonardoMsg(ownId, title, detail, ok, close, inverse);
        },


        //=============================================================================================
        newAppTitle: function (oldTitle, customer) {
            //=========================================================================================
            return oldTitle.split('{')[0] + '{' + customer + '}' + (oldTitle.indexOf('}') > -1 ? oldTitle.split('}')[1] : '')
        },


        //=============================================================================================
        qrsCall: async function (method, endpoint, body) {
            //=========================================================================================
            ret = await qrsCall(method, endpoint, body);
            return ret;
        },


        //=============================================================================================
        readSheetDescr: async function (enigma, layout, app) { //, sheetMatrix, sheetList, tagList, menuEntries, menuTree) {
            //=========================================================================================
            var sheetMatrix = [];
            var sheetList = [];
            var tagList = [];
            var menuEntries = [];
            var menuTree = [];

            console.log('calling function readSheetDescr ...');
            var vFormula_1 = 'Pick(RowNo()\n';
            // get the list of sheets with enigma
            var sessObj = await enigma.createSessionObject({
                qInfo: { qType: "SheetList" },
                qAppObjectListDef: {
                    qType: "sheet",
                    qData: { title: "/qMetaDef/title", rank: "/rank" }
                }
            });
            var allSheets = await sessObj.getLayout()
            // sort the sheetList by rank
            allSheets.qAppObjectList.qItems.sort(function (a, b) {
                if (a.qData.rank < b.qData.rank) return -1;
                if (a.qData.rank > b.qData.rank) return 1;
                return 0;
            });
            //console.log(allSheets.qAppObjectList.qItems);

            allSheets.qAppObjectList.qItems.forEach(function (shLayout, i) {
                var sheetTitle = shLayout.qMeta.title;
                sheetList.push("Dual('" + sheetTitle.replace(/'/g, "'&chr(39)&'") + "'," + i + ")");
                sheetMatrix[sheetTitle] = { tags: [] };
                var sheetDescr = shLayout.qMeta.description;

                // Build the sheet menu from the sheet description, entries between [square brakets] are taken
                sheetDescr.split('[').forEach(function (e, i) {
                    if (i > 0) {
                        var menu = e.split(']')[0];
                        //console.log('sheet ', shLayout.qInfo.qId, ' is on menu ' + menu);
                        if (!menuEntries.includes(menu)) {
                            menuTree.push({
                                menu: menu,
                                id: menuTree.length,
                                link: shLayout.qInfo.qId,
                                title: sheetTitle
                            });
                            menuEntries.push(menu);
                        } else { // convert simple entry to children entry
                            var addChildrenTo = menuEntries.indexOf(menu);
                            // already has children?
                            if (!menuTree[addChildrenTo].hasOwnProperty('children')) {
                                menuTree[addChildrenTo].children = [{
                                    menu: menuTree[addChildrenTo].title,
                                    link: menuTree[addChildrenTo].link,
                                }];
                                menuTree[addChildrenTo].title = null;
                                menuTree[addChildrenTo].link = null;
                            }
                            menuTree[addChildrenTo].children.push({
                                menu: sheetTitle,
                                link: shLayout.qInfo.qId
                            })
                        }
                    }
                })

                // search for customer-tags in {curly-brackets} in the sheet description
                sheetDescr.split('{').forEach(function (e, i) {
                    if (i > 0) {
                        var tag = e.split('}')[0];
                        if (!tagList.includes(tag)) tagList.push(tag);
                        sheetMatrix[sheetTitle].tags.push(tag);
                    }
                })
                if (sheetMatrix[sheetTitle].tags.length > 0) {
                    vFormula_1 += ",If(Match($(vViewTagsDim),'{" + sheetMatrix[sheetTitle].tags.join("}','{") + "}'),Chr(10003),'')\n"
                } else {
                    vFormula_1 += ',Null()\n'
                }

            })
            //console.log('sheetMatrix', sheetMatrix);
            console.log('menuTree', menuTree);

            if (layout.pSetQlikVars) {
                app.variable.setStringValue('vViewSheetsDim', "ValueList(" + sheetList.join(",") + ")");
                app.variable.setStringValue('vViewTagsDim', "ValueList('{" + tagList.join("}','{") + "}')");
                //app.variable.setStringValue('vViewSheetTag', vFormula1.substr(1) + vFormula2);
                app.variable.setStringValue('vViewSheetTag', vFormula_1 + ')');
            }

            return {
                sheetMatrix: sheetMatrix,
                sheetList: sheetList,
                tagList: tagList,
                menuEntries: menuEntries,
                menuTree: menuTree
            }
        },

        //=============================================================================================        
        exportOrReloadApp: async function (layout, appId, newAppTitle, exportMode, baseUrl, keepSheetIds) {
            //=========================================================================================
            const ownId = layout.qInfo.qId;
            console.log('function exportOrReloadApp');
            try {

                leonardoMsg(ownId, 'Progress',
                    '<div class="spinningwheel">&nbsp;</div>'
                    +'<br/>Making a copy of this app ...', null, null, false);

                var copiedAppInfo = await qrsCall('POST', '/app/' + appId + '/copy');

                const payload1 = {
                    name: newAppTitle,
                    modifiedDate: "2199-12-31T23:59:59.999Z"
                }
                //console.log('pyld1', payload1);
                await qrsCall('PUT', '/app/' + copiedAppInfo.id, JSON.stringify(payload1));

                leonardoMsg(ownId, 'Progress',
                    '<div class="spinningwheel">&nbsp;</div>'
                    +'<br/>Removing non-relevant sheets ...', null, null, false);

                var foundSheets = await qrsCall('GET', '/app/object?filter=app.id eq '
                    + copiedAppInfo.id + " and objectType eq 'sheet'");
                console.log('keepSheetIds', keepSheetIds);
                foundSheets.forEach(async function (foundSheet, i) {
                    //console.log(i, foundSheet.engineObjectId, keepSheetIds.indexOf(foundSheet.engineObjectId));
                    if (keepSheetIds.indexOf(foundSheet.engineObjectId) == -1) {
                        //console.log(i + '. remove sheet ' + foundSheet.engineObjectId + ' in app copy.')
                        await qrsCall('DELETE', '/app/object/' + foundSheet.id);
                    }
                });

                // var form = $.ajax({ type: "GET", url: "../extensions/sheetnavi/download.html", async: false });
                // form = form.responseText;

                console.log('exportMode', exportMode);
                if (exportMode == 'exportEmpty') {

                    await downloadApp(copiedAppInfo.id, ownId, baseUrl, layout, true, true);

                } else if (exportMode == 'copyReload') {


                    leonardoMsg(ownId, 'Progress',
                        '<div class="spinningwheel">&nbsp;</div>'
                        + '<div id="' + ownId + '_rldtxt"><br/>Reloading app in background...<hr /></div>'
                        + 'Status: <span id="' + ownId + '_rldstat">...</span>'
                        + '<button class="lui-button" style="float:right;display:none;" id="' + ownId + 'downloadbtn'
                        + '">download now</button>', 'Close', null, false);
                    var res1 = await qrsCall('POST', '/app/' + copiedAppInfo.id + '/reload');

                    // Watch progress of reload
                    var timer;
                    var watchThisTask;
                    $('#msgok_' + ownId).on('click', function () {
                        // button Close clicked, stop watching
                        clearInterval(timer);
                        $('#msgparent_' + ownId).remove();
                    });


                    // get list of "Manually" tasks for this app
                    var tasks = await qrsCall('GET', "/reloadtask?filter=name sw 'Manually' and app.id eq " + copiedAppInfo.id);
                    var startTimer = Date.now();
                    if (tasks.length == 1) {
                        watchThisTask = tasks[0].id;
                        timer = setInterval(checkTaskProgress, 3000, watchThisTask);
                    } else {
                        $('#' + ownId + '_rldstat').text('multiple tasks found, cannot check status.');
                    }
                    // text codes for the statuses
                    var statusList = ('0;1;<reload> Running;3;4;5;6;<tick> Finished;<warning> Failed')
                        .replace(/</g, '<span class="lui-icon  lui-icon--').replace(/>/g, '"></span>').split(';');

                    function checkTaskProgress(watchThisTask) {
                        var timeSince = Math.round((Date.now() - startTimer) / 1000);
                        timeSince = (timeSince > 59 ? Math.floor(timeSince / 60) : 0) + ':' + ('0' + (timeSince % 60)).slice(-2);
                        $('#' + ownId + '_rldstat').text('');
                        qrsCall('GET', "/reloadtask/" + watchThisTask)
                            .then(function (task) {
                                if (task.operational && task.operational.lastExecutionResult) {
                                    var status = task.operational.lastExecutionResult.status;
                                    if (statusList[status]) status = statusList[status];
                                    $('#' + ownId + '_rldstat').html(status + ' (' + timeSince + ')');

                                    if (task.operational.lastExecutionResult.duration > 0) {
                                        clearInterval(timer);
                                        $('#' + ownId + 'downloadbtn').show();
                                        $('#' + ownId + 'downloadbtn').on('click', function () {
                                            downloadApp(copiedAppInfo.id, ownId, baseUrl, layout, false, false);
                                        });
                                        $('#' + ownId + '_rldtxt').remove();
                                        $('.spinningwheel').remove();
                                        console.log('Reload Task finished:');
                                    }
                                }
                            });
                    }

                }

            } catch (error) {
                leonardoMsg(ownId, 'Error', JSON.stringify(error), null, 'Close', true);
            }
        }

    };



    //=============================================================================================
    async function downloadApp(dwnAppId, msgId, baseUrl, layout, deleteApp, skipData) {
        //=========================================================================================

        leonardoMsg(msgId, 'Progress',
            '<div class="spinningwheel">&nbsp;</div><br/>Creating download link ...',
            null, null, false);

        const guid = createGuid();
        var res1 = await qrsCall('POST', '/app/' + dwnAppId + '/export/' + guid + (skipData ? '?skipData=true' : ''));

        const filename = res1.downloadPath.split('/')[3].split('?')[0];

        if (deleteApp) qrsCall('DELETE', '/app/' + dwnAppId);

        // making GET request with a request-http-header then compute a blob-download link

        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                //console.log('GET response:', this);

                var type = xhr.getResponseHeader('Content-Type');
                var blob = new Blob([this.response], { type: type });
                if (typeof window.navigator.msSaveBlob !== 'undefined') {
                    // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    var URL = window.URL || window.webkitURL;
                    var downloadUrl = URL.createObjectURL(blob);

                    if (filename) {
                        // use HTML5 a[download] attribute to specify filename
                        var a = document.createElement("a");
                        // safari doesn't support this yet
                        if (typeof a.download === 'undefined') {
                            window.location = downloadUrl;
                        } else {
                            a.href = downloadUrl;
                            a.download = decodeURI(filename);
                            document.body.appendChild(a);
                            a.click();
                            leonardoMsg(msgId, 'Done',
                                '<span class="lui-icon  lui-icon--tick"></span> App export completed. <hr />'
                                + 'Do you want to import to MyZurich? Go to<br />'
                                + (layout.pHubSIT == '' ? '' : '<a class="lui-button" href="' + layout.pHubSIT + '" target="_blank">SIT</a> ')
                                + (layout.pHubUAT == '' ? '' : '<a class="lui-button" href="' + layout.pHubUAT + '" target="_blank">UAT</a> ')
                                + (layout.pHubProd == '' ? '' : '<a class="lui-button" href="' + layout.pHubProd + '" target="_blank">Prod</a> ')
                                + (deleteApp ? '' : '<div class="deleteSection"><hr /><button id="deleteApp' + msgId 
                                + '" class="lui-button">Delete</button> exported app now.</div>')
                                , null, 'Close', false);
                            $('#deleteApp'+msgId).on('click', async function(){ 
                                $('.deleteSection').html('<hr/>Deleting export copy ...');
                                await qrsCall('DELETE', '/app/' + dwnAppId);
                                $('.deleteSection').html('<hr/>Deleted export copy.');
                            });
                        }
                    } else {
                        window.location = downloadUrl;
                    }

                    setTimeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
                }
            }
        });
        xhr.responseType = 'blob';
        xhr.open("GET", baseUrl.slice(0, -1) + res1.downloadPath);
        //xhr.setRequestHeader(layout.pHdrKey, layout.pHdrVal);
        xhr.send();
    }



    //=============================================================================================
    function leonardoMsg(ownId, title, detail, ok, close, inverse) {
        //=========================================================================================
        // This html was found on https://qlik-oss.github.io/leonardo-ui/dialog.html
        if (document.getElementById('msgparent_' + ownId)) document.getElementById('msgparent_' + ownId).remove();

        var node = document.createElement("div");
        node.id = "msgparent_" + ownId;
        var html =
            '  <div class="lui-modal-background"></div>' +
            '  <div class="lui-dialog' + (inverse ? '  lui-dialog--inverse' : '') + '" style="width: 400px;top:80px;">' +
            '    <div class="lui-dialog__header">' +
            '      <div class="lui-dialog__title">' + title + '</div>' +
            '    </div>' +
            '    <div class="lui-dialog__body">' +
            detail +
            '    </div>' +
            '    <div class="lui-dialog__footer">';
        if (close) {
            html +=
                '  <button class="lui-button  lui-dialog__button' + (inverse ? '  lui-button--inverse' : '') + '" ' +
                '   onclick="var elem=document.getElementById(\'msgparent_' + ownId + '\');elem.parentNode.removeChild(elem);">' +
                close +
                ' </button>'
        }
        if (ok) {
            html +=
                '  <button class="lui-button  lui-dialog__button  ' + (inverse ? '  lui-button--inverse' : '') + '" id="msgok_' + ownId + '">' +
                ok +
                ' </button>'
        };
        html +=
            '     </div>' +
            '  </div>';
        node.innerHTML = html;
        document.getElementById("qs-page-container").append(node);
    };


    //=============================================================================================
    async function qrsCall(method, endpoint, body) {
        //=========================================================================================

        let result;
        const baseUrl = location.href.substr(0, location.href.indexOf('/sense/app') + 1);

        try {
            var headers = [];
            const xrfkey = ('' + Math.random()).replace('.', '').repeat(6).substr(0, 16);
            //headers[layout.pHdrKey] = layout.pHdrVal;
            headers["X-Qlik-Xrfkey"] = xrfkey;
            if (method.toUpperCase() != 'GET') headers["Content-Type"] = 'application/json';
            endpoint += (endpoint.indexOf('?') == -1 ? '?xrfkey=' : '&xrfkey=') + xrfkey;
            var args = {
                timeout: 0,
                method: method,
                url: baseUrl + 'qrs' + endpoint,
                headers: headers
            };
            if (body) args.data = body;
            console.log('$.ajax request', args);
            result = await $.ajax(args);
            console.log('$.ajax response', result);
            return result;

        } catch (error) {
            leonardoMsg('qrs_error', 'Error 152', error.responseText, null, 'Close', false);
            console.log('error', error.status + ' ' + error.responseText);
        }
    }

    //=============================================================================================    
    function createGuid() {
        //=========================================================================================

        return ('').concat(
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1), '-',
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1),
            Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
        );
    }
})