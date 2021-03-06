(function () {
    'use strict';

    angular.module('angularSimpleUploader', ['notice', 'cfp.loadingBar'])
        .directive('uploadButton', ['$compile', '$timeout', 'cfpLoadingBar', function ($compile, $timeout, cfpLoadingBar) {
            return {
                restrict: 'A',
                replace: false,
                require: 'ngModel',
                scope: {accept: '@', preview: '@', singular: '@', uploading: '=', onUploadComplete: '='},
                link: function ($scope, element, attrs, ngModel) {
                    var guid = Math.random().toString(36).slice(2);
                    var iframeHTML = '<iframe name="' + guid + '" width="1" height="1" style="opacity: 0;width:0;height:0;position: absolute;top:-100px;" tabindex="-1" src="/generic/file-uploader"></iframe>';

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
                        var multiple = $scope.singular !== 'true';
                        //console.log("$scope.singular, multiple: ", $scope.singular, multiple);

                        if (html) {
                            iframe.document.body.outerHTML = html;
                        }

                        var theCb = iframe.document.getElementById('theCb');
                        var theFile = iframe.document.getElementById('theFile');

                        theFile.onchange = function () {
                            $timeout(function () {
                                if (angular.isDefined($scope.uploading)) {
                                    $scope.uploading = true;
                                }
                            });

                            iframe.document.forms[0].submit();
                            cfpLoadingBar.start();
                        };

                        if (theFile && theCb) {
                            if (multiple) {
                                theFile.setAttribute('multiple', 'multiple');
                            }

                            if ($scope.accept) {
                                theFile.setAttribute('accept', map[$scope.accept] || $scope.accept);
                            }

                            window[guid] = function (uploads) {
                                ngModel.$setViewValue(multiple || !uploads ? uploads : uploads[0]);

                                $timeout(function () {
                                    if (angular.isDefined($scope.uploading)) {
                                        $scope.uploading = false;
                                    }
                                    cfpLoadingBar.complete();

                                    if (typeof($scope.onUploadComplete) == 'function') {
                                        $scope.onUploadComplete(ngModel.$viewValue);
                                    }
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
                            var singular = $scope.singular === 'true';
                            var html = '<b>' + (!singular ? (ngModel.$modelValue.length + ' files attached') : basename(ngModel.$modelValue)) + '</b> ' +
                                '<span class="left-padded pull-right text-small"> <a href="#" ng-click="remove()"><i class="fa fa-trash"></i> remove</a></span>';

                            if (($scope.accept == 'image') && singular) {
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
        }])
        .directive('uploadLink', ['$compile', '$timeout', 'cfpLoadingBar', '$notice', function ($compile, $timeout, cfpLoadingBar, $notice) {
            return {
                restrict: 'A',
                replace: false,
                require: 'ngModel',
                scope: {proxy: '@', uploading: '=', onUploadComplete: '='},
                link: function ($scope, element, attrs, ngModel) {
                    element.click(function () {
                        $scope.setUrl = function (url) {
                            ngModel.$setViewValue(url);

                            $timeout(function () {
                                if (angular.isDefined($scope.uploading)) {
                                    $scope.uploading = false;
                                }

                                cfpLoadingBar.complete();

                                if (typeof($scope.onUploadComplete) == 'function') {
                                    $scope.onUploadComplete(ngModel.$viewValue);
                                }
                            });
                        };

                        $notice.prompt('URL', 'Upload from URL', 'Please copy-paste the URL from which you want to import', 'http://', 'url', 'Cancel', 'Import', 'Example: http://i.imgur.com/3y4J6mp.jpg')
                            .then(function (url) {
                                if ($scope.proxy == 'false') {
                                    $scope.setUrl(url);
                                } else {
                                    $http.post('/generic/url-proxy', {urls: [url]}).then(function (result) {
                                        var urls = obj.data ? obj.data[0] : null;
                                        if (urls && urls.copy) {
                                            $scope.setUrl(urls.copy);
                                        }
                                    }, $notice.defaultError);
                                }
                            });
                    });
                }
            }
        }]);
})();