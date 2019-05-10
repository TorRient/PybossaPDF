const PybossaLoader = {
    init: function(){
        this.taskLoaded();
        this.presentTask();
        pybossa.run('pdf');
    },
    renderPage: function(task){
        // Using promise to fetch the page
        task.pdfDoc.getPage(task.pageNum).then(function (page) {
            var viewport = page.getViewport(task.scale);
            task.canvas.height = viewport.height;
            task.canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: task.ctx,
                viewport: viewport
            };
            page.render(renderContext);
        });
    },
    zoom: function(task,v){
        task.pdfDoc.getPage(task.pageNum).then(function (page) {
            if (v === 1) {
                task.scale = task.scale + 0.1;
                if (task.scale >= 2) {
                    task.scale = 2;
                }
            }
            if (v === -1) {
                task.scale = task.scale - 0.1;
                if (task.scale <= 0) {
                    task.scale = 0.1;
                }
            }
            if (v === 0) {
                task.scale = 0.8;
            }
            var viewport = page.getViewport(task.scale + 0.1);
            task.canvas.height = viewport.height;
            task.canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: task.ctx,
                viewport: viewport
            };
            page.render(renderContext);
        });
    },
    enableDisabledNavButtons: function(task){
        if (task.pageNum === 1) {
            $("#next").removeClass("disabled");
            $("#prev").addClass("disabled");
        }
        else if (task.pageNum === task.pdfDoc.numPages) {
            $("#prev").removeClass("disabled");
            $("#next").addClass("disabled");
        }
        else {
            $("#next").removeClass("disabled");
            $("#prev").removeClass("disabled");
        }
    },
    goPreviousPage: function(task){
        if (task.pageNum <= 1)
                return;
            task.pageNum--;
            PybossaLoader.renderPage(task);
            $("#currentPage").text(task.pageNum);
            PybossaLoader.enableDisabledNavButtons(task);
    },
    goNextPage: function(task){
        if (task.pageNum >= task.pdfDoc.numPages)
                return;
            task.pageNum++;
            PybossaLoader.renderPage(task);
            $("#currentPage").text(task.pageNum);
            PybossaLoader.enableDisabledNavButtons(task);
    },
    loadUserProgress: function(){
        pybossa.userProgress('pdf').done(function (data) {
            var pct = Math.round((data.done * 100) / data.total);
            $("#progress").css("width", pct.toString() + "%");
            $("#progress").attr("title", pct.toString() + "% completed!");
            $("#progress").tooltip({ 'placement': 'left' });
            $("#total").text(data.total);
            $("#done").text(data.done);
        });
    },
    showPaginationOptions: function(task){
        if (task.pagination) {
            $("#currentPage").text(task.pageNum);
            $("#totalPages").text(task.pdfDoc.numPages);
            $(".btn-navigate").show();
            $("#pages").show();
        }
        else {
            $(".btn-navigate").hide();
            $("#pages").hide();
        }
    },
    taskLoaded: function(){
        pybossa.taskLoaded(function (task, deferred) {
            console.log(task);
            if (!$.isEmptyObject(task)) {
                if (task.state == 'completed') {
                    $('#answer').hide();
                    $('#taskcompleted').show();
                }
                // NOTE: 
                // Modifying the URL below to another server will likely *NOT* work. Because of browser
                // security restrictions, we have to use a file server with special headers
                // (CORS) - most servers don't support cross-origin browser requests.
                // Asynchronously download PDF as an ArrayBuffer
                var canvas = $("<canvas/>", { "id": "canvas_" + task.id });
                var viewport = $("<div/>", { "id": "viewport_" + task.id });
                viewport.css("width", "100%");
                viewport.css("height", "100vh");
                viewport.css("display", "none");
                viewport.append(canvas);
                $("#answer").append(viewport);
                $('#viewport_' + task.id).dragscrollable({ dragSelector: '#canvas_' + task.id });
                task.canvas = document.getElementById('canvas_' + task.id);
                task.ctx = document.getElementById("canvas_" + task.id).getContext('2d');
                task.scale = 0.9;
                task.pagination = (task.info.page === undefined);
                task.pageNum = task.info.page || 1;
                PDFJS.getDocument(task.info.pdf_url).then(function getPdfHelloWorld(_pdfDoc) {
                    task.pdfDoc = _pdfDoc;
                    deferred.resolve(task);
                });
            }
            else {
                deferred.resolve(task);
            }
        });
    },
    presentTask: function(){
        pybossa.presentTask(function (task, deferred) {
            if (!$.isEmptyObject(task)) {
                PybossaLoader.loadUserProgress();
                RENDER_OPTIONS.documentId = task.info.pdf_url;
                $("textarea#text").val('');
                $("#viewport_" + task.id).show();
                PybossaLoader.showPaginationOptions(task);
                // renderPage(task);
                $("#question h1").text(task.info.question);
                $("#task-id").text(task.id);
                $("#loading").hide();
                PybossaLoader.enableDisabledNavButtons(task);
                Annotate.init();
                $(".btn-zoom").off('click').on('click', function (evt) {
                    PybossaLoader.zoom(task, parseInt($(this).attr("value")));
                });
                $(".btn-navigate").off('click').on('click', function (evt) {
                    if ($(this).attr("value") === "next") {
                        PybossaLoader.goNextPage(task);
                        return;
                    }
                    if ($(this).attr("value") === "prev") {
                        PybossaLoader.goPreviousPage(task);
                        return;
                    }
                });
                $(".btn-submit").off('click').on('click', function () {
                    var answer = $("textarea#text").val();
                    $("#viewport_" + task.id).hide();
                    pybossa.saveTask(task.id, answer).done(function (data) {
                        deferred.resolve();
                        $("#success").fadeIn();
                        setTimeout(function () { $("#success").fadeOut() }, 2000);
                    })
                });
            }
            else {
                $(".skeleton").hide();
                $("#finish").fadeIn();
            }
        });
    }
}