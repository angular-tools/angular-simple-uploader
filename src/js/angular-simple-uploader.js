(function () {
    'use strict';

    angular.module('angularSimpleUploader', ['notice'])
        .directive('uploadButton', ['$compile', '$timeout', function ($compile, $timeout) {
            return {
                restrict: 'A',
                replace: false,
                require: 'ngModel',
                scope: {accept: '@', multiple: '@', preview: '@', uploading: '=', onUploadComplete: '='},
                link: function ($scope, element, attrs, ngModel) {
                    var guid = Math.random().toString(36).slice(2);
                    var iframeHTML = '<iframe name="' + guid + '" width="1" height="1" style="opacity: 0;width:0;height:0;position: absolute;top:-100px;" tabindex="-1" src="/generic/simple-uploader"></iframe>';

                    $('body').append(iframeHTML);

                    var iframe = window.frames[guid];
                    var getHtml = function () {
                        if (!iframe.document.getElementById('theFile')) {
                            setTimeout(getHtml, 100);
                        } else {
                            html = iframe.document.body.outerHTML;
                        }
                    };
                    var html = getHtml();
                    var map = {image: '.png, .jpg, .jpeg .gif', 'video': '.avi, .mov, .wmv, .mp4, .flv', 'audio': '.wav, .mp3, .ogg'};

                    element.click(function () {
                        if (html) {
                            iframe.document.body.outerHTML = html;
                        }

                        var theCb = iframe.document.getElementById('theCb');
                        var theFile = iframe.document.getElementById('theFile');

                        theFile.onchange = function () {
                            $timeout(function () {$scope.uploading = true;});
                            iframe.document.forms[0].submit();
                        };

                        if (theFile && theCb) {
                            if ($scope.multiple) {
                                theFile.setAttribute('multiple', 'multiple');
                            }

                            if ($scope.accept) {
                                theFile.setAttribute('accept', map[$scope.accept] || $scope.accept);
                            }

                            window[guid] = function (uploads) {
                                ngModel.$setViewValue($scope.multiple || !uploads ? uploads : uploads[0]);
                                $timeout(function () {
                                    if (typeof($scope.onUploadComplete) == 'function') {
                                        $scope.onUploadComplete(uploads);
                                    }
                                    $scope.uploading = false;
                                });
                                window[guid] = null;
                            };

                            theCb.value = guid;
                            theFile.click();
                        }

                        $(element).popover('hide');
                    });

                    $scope.remove = function () {
                        event.stopImmediatePropagation();
                        ngModel.$setViewValue(null);
                        $(element).popover('hide');
                    };

                    if ($scope.preview) {
                        var tmout = 0;
                        var basename = function (url) { return url ? url.split('/').pop() : '';};
                        var popover = '<div class="popover" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>';

                        var getContent = function () {
                            var html = '<b>' + ($scope.multiple ? (ngModel.$modelValue.length + ' files attached') : basename(ngModel.$modelValue)) + '</b> ' +
                                '<span class="left-padded pull-right text-small"> <a href="#" ng-click="remove()"><i class="fa fa-trash"></i> remove</a></span>';

                            if (($scope.accept == 'image') && !$scope.multiple) {
                                html += '<p><img class="thumbnail" src="' + ngModel.$modelValue + '" style="max-width:200px;max-height:200px;"></p>';
                            }

                            return $compile('<div>' + html + '</div>')($scope);
                        };

                        $(element).popover({container: element, trigger: 'manual', html: true, template: popover, content: getContent});
                        $(element).hover(
                            function () {
                                if (ngModel.$modelValue) {
                                    clearTimeout(tmout);
                                    $(element).popover('show');
                                }
                            },
                            function () {
                                clearTimeout(tmout);
                                tmout = setTimeout(function () {$(element).popover('hide');}, 350);
                            }
                        );
                    }
                }
            };
        }]);
})();