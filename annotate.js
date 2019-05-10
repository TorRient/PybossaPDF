let RENDER_OPTIONS = {
    documentId: 'https://www.cbs.dk/files/cbs.dk/cv_template_sheet_en.pdf',
    pdfDocument: null,
    scale: parseFloat(localStorage.getItem(`${this.documentId}/scale`), 10) || 1,
    rotate: parseInt(localStorage.getItem(`${this.documentId}/rotate`), 10) || 0
};
let PAGE_HEIGHT;
let NUM_PAGES = 0;
let CURRENT_PAGE = 1;
const { UI } = PDFAnnotate;
// Previous page of the PDF
$("#pdf-prev").on('click', function() {
    if(CURRENT_PAGE != 1)
        Annotate.showPage(--CURRENT_PAGE);
});

// Next page of the PDF
$("#pdf-next").on('click', function() {
    if(CURRENT_PAGE != NUM_PAGES)
        Annotate.showPage(++CURRENT_PAGE);
});
const Annotate = {
    init: function () {
        this.render();
        this.toolbarButtons();
        this.scaleRotate();
        this.clearToolbar();
        this.commentStuff(window, document);
    },
    render: function () {
        PDFJS.getDocument(RENDER_OPTIONS.documentId).then((pdf) => {
            RENDER_OPTIONS.pdfDocument = pdf;

            let viewer = document.getElementById('viewer');
            viewer.innerHTML = '';
            NUM_PAGES = pdf.pdfInfo.numPages;
            let page = UI.createPage(1);
            viewer.append(page);

            UI.renderPage(1, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
                let viewport = pdfPage.getViewport(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate);
                PAGE_HEIGHT = viewport.height;
            });
            $("#pdf-current-page").text(1);
            $("#pdf-total-pages").text(NUM_PAGES);
        });
    },
    showPage: function(pageNo){
        $("#pdf-current-page").text(pageNo);
        PDFJS.getDocument(RENDER_OPTIONS.documentId).then((pdf) => {
            RENDER_OPTIONS.pdfDocument = pdf;
            let viewer = document.getElementById('viewer');
            viewer.innerHTML = '';
            NUM_PAGES = pdf.pdfInfo.numPages;
            let page = UI.createPage(pageNo);
            viewer.append(page);
            UI.renderPage(pageNo, RENDER_OPTIONS).then(([pdfPage, annotations]) => {
                let viewport = pdfPage.getViewport(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate);
                PAGE_HEIGHT = viewport.height;
            });
        });
    },
    textStuff: function () {
        let textSize;
        let textColor;
        function initText() {
            let size = $('.toolbar .text-size');
            [8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96].forEach((s) => {
                size.append(new Option(s, s));
            });
            setText(
                localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/size`) || 10,
                localStorage.getItem(`${RENDER_OPTIONS.documentId}/text/color`) || '#000000'
            );

            initColorPicker($('.text-color'), textColor, function (value) {
                setText(textSize, value);
            });
        }
        function setText(size, color) {
            let modified = false;
            if (textSize !== size) {
                modified = true;
                textSize = size;
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/size`, textSize);
                $('.toolbar .text-size').value = textSize;
            }
            if (textColor !== color) {
                modified = true;
                textColor = color;
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/text/color`, textColor);

                let selected = $('.toolbar .text-color.color-selected');
                if (selected) {
                    selected.removeClass('color-selected');
                    selected.removeAttr('aria-selected');
                }
                selected = $(`.toolbar .text-color[data-color="${color}"]`);
                if (selected) {
                    selected.addClass('color-selected');
                    selected.attr('aria-selected', true);
                }
            }
            if (modified) {
                UI.setText(textSize, textColor);
            }
        }
        function handleTextSizeChange(e) {
            setText(e.target.value, textColor);
        }
        $('.toolbar .text-size').on('change', handleTextSizeChange);
        initText();
    },
    penStuff: function () {
        let penSize;
        let penColor;
        function initPen() {
            let size = $('.toolbar .pen-size');
            for (let i = 0; i < 20; i++) {
                size.append(new Option(i + 1, i + 1));
            }
            setPen(
                localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/size`) || 1,
                localStorage.getItem(`${RENDER_OPTIONS.documentId}/pen/color`) || '#000000'
            );
            initColorPicker($('.pen-color'), penColor, function (value) {
                setPen(penSize, value);
            });
        }
        function setPen(size, color) {
            let modified = false;
            if (penSize !== size) {
                modified = true;
                penSize = size;
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/size`, penSize);
                $('.toolbar .pen-size').value = penSize;
            }
            if (penColor !== color) {
                modified = true;
                penColor = color;
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/pen/color`, penColor);
                let selected = $('.toolbar .pen-color.color-selected');
                if (selected) {
                    selected.removeClass('color-selected');
                    selected.removeAttr('aria-selected');
                }
                selected = $(`.toolbar .pen-color[data-color="${color}"]`);
                if (selected) {
                    selected.addClass('color-selected');
                    selected.attr('aria-selected', true);
                }
            }
            if (modified) {
                UI.setPen(penSize, penColor);
            }
        }
        function handlePenSizeChange(e) {
            setPen(e.target.value, penColor);
        }
        $('.toolbar .pen-size').on('change', handlePenSizeChange);
        initPen();
    },
    toolbarButtons: function () {
        let tooltype = localStorage.getItem(`${RENDER_OPTIONS.documentId}/tooltype`) || 'cursor';
        if (tooltype) {
            setActiveToolbarItem(tooltype, document.querySelector(`.toolbar button[data-tooltype=${tooltype}]`));
        }
        function setActiveToolbarItem(type, button) {
            let active = document.querySelector('.toolbar button.active');
            if (active) {
                active.classList.remove('active');
                switch (tooltype) {
                    case 'cursor':
                        UI.disableEdit();
                        break;
                    case 'draw':
                        UI.disablePen();
                        break;
                    case 'text':
                        UI.disableText();
                        break;
                    case 'point':
                        UI.disablePoint();
                        break;
                    case 'area':
                    case 'highlight':
                    case 'strikeout':
                        UI.disableRect();
                        break;
                }
            }
            if (button) {
                button.classList.add('active');
            }
            if (tooltype !== type) {
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/tooltype`, type);
            }
            tooltype = type;
            switch (type) {
                case 'cursor':
                    UI.enableEdit();
                    break;
                case 'draw':
                    UI.enablePen();
                    break;
                case 'text':
                    UI.enableText();
                    break;
                case 'point':
                    UI.enablePoint();
                    break;
                case 'area':
                case 'highlight':
                case 'strikeout':
                    UI.enableRect(type);
                    break;
            }
        }
        function handleToolbarClick(e) {
            if (e.target.nodeName === 'BUTTON') {
                setActiveToolbarItem(e.target.getAttribute('data-tooltype'), e.target);
            }
        }
        document.querySelector('.toolbar').addEventListener('click', handleToolbarClick);
    },
    scaleRotate: function () {
        function setScaleRotate(scale, rotate) {
            scale = parseFloat(scale, 10);
            rotate = parseInt(rotate, 10);

            if (RENDER_OPTIONS.scale !== scale || RENDER_OPTIONS.rotate !== rotate) {
                RENDER_OPTIONS.scale = scale;
                RENDER_OPTIONS.rotate = rotate;

                localStorage.setItem(`${RENDER_OPTIONS.documentId}/scale`, RENDER_OPTIONS.scale);
                localStorage.setItem(`${RENDER_OPTIONS.documentId}/rotate`, RENDER_OPTIONS.rotate % 360);

                Annotate.render();
            }
        }
        function handleScaleChange(e) {
            setScaleRotate(e.target.value, RENDER_OPTIONS.rotate);
        }
        function handleRotateCWClick() {
            setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate + 90);
        }
        function handleRotateCCWClick() {
            setScaleRotate(RENDER_OPTIONS.scale, RENDER_OPTIONS.rotate - 90);
        }
        $('.toolbar select.scale').val(RENDER_OPTIONS.scale);
        $('.toolbar select.scale').on('change', handleScaleChange);
        $('.toolbar .rotate-ccw').on('click', handleRotateCCWClick);
        $('.toolbar .rotate-cw').on('click', handleRotateCWClick);
    },
    clearToolbar: function () {
        function handleClearClick(e) {
            if (confirm('Are you sure you want to clear annotations?')) {
                for (let i = 0; i < NUM_PAGES; i++) {
                    $(`div#pageContainer${i + 1} svg.annotationLayer`).innerHTML = '';
                }

                localStorage.removeItem(`${RENDER_OPTIONS.documentId}/annotations`);
            }
        }
        $('a.clear').on('click', handleClearClick);
    },
    commentStuff: function (window, document) {
        let commentList = document.querySelector('#comment-wrapper .comment-list-container');
        let commentForm = document.querySelector('#comment-wrapper .comment-list-form');
        let commentText = commentForm.querySelector('input[type="text"]');

        function supportsComments(target) {
            let type = target.getAttribute('data-pdf-annotate-type');
            return ['point', 'highlight', 'area'].indexOf(type) > -1;
        }

        function insertComment(comment) {
            let child = document.createElement('div');
            child.className = 'comment-list-item';
            child.innerHTML = twitter.autoLink(twitter.htmlEscape(comment.content));

            commentList.appendChild(child);
        }

        function handleAnnotationClick(target) {
            if (supportsComments(target)) {
                let documentId = target.parentNode.getAttribute('data-pdf-annotate-document');
                let annotationId = target.getAttribute('data-pdf-annotate-id');

                PDFAnnotate.getStoreAdapter().getComments(documentId, annotationId).then((comments) => {
                    commentList.innerHTML = '';
                    commentForm.style.display = '';
                    commentText.focus();

                    commentForm.onsubmit = function () {
                        PDFAnnotate.getStoreAdapter().addComment(documentId, annotationId, commentText.value.trim())
                            .then(insertComment)
                            .then(() => {
                                commentText.value = '';
                                commentText.focus();
                            });

                        return false;
                    };

                    comments.forEach(insertComment);
                });
            }
        }

        function handleAnnotationBlur(target) {
            if (supportsComments(target)) {
                commentList.innerHTML = '';
                commentForm.style.display = 'none';
                commentForm.onsubmit = null;

                insertComment({ content: 'No comments' });


            }
        }

        UI.addEventListener('annotation:click', handleAnnotationClick);
        UI.addEventListener('annotation:blur', handleAnnotationBlur);
    },
    getAnnotate: function () {
        PDFAnnotate.getStoreAdapter().getAnnotations(RENDER_OPTIONS.documentId, 1)
            .then((data) => {
                console.log(data.documentId); // "example.pdf"
                console.log(data.pageNumber); // 1
                console.log(data.annotations); // Array
            }, (error) => {
                console.log(error.message);
            })
    }
}
