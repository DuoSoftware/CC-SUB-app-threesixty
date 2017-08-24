////////////////////////////////
// App : 360
// Owner  : Gihan Herath
// Last changed date : 2017/08/24
// Version : 6.1.0.13
// Modified By : Kasun
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.threesixty', [])
        .config(config)
        .filter('parseDate',parseDateFilter)
        .filter('numberFixedLen',numberFixedLength)
		.filter('trustUrl', function ($sce) {
			return function(url) {
				return $sce.trustAsResourceUrl(url);
			};
		});

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider, mesentitlementProvider, $sceDelegateProvider)
    {

        function gst(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            //debugger;
            return null;
        }
        /** Check for Super admin */
        var isSuperAdmin = gst('isSuperAdmin');
        /** Check for Super admin - END */ 

        $stateProvider
            .state('app.threesixty', {
                url    : '/threesixty',
                views  : {
                    'threesixty@app': {
                        templateUrl: 'app/main/360/threesixty.html',
                        controller : 'ThreeSixtyController as vm'
                    }
                },
                resolve: {
					security: ['$q','mesentitlement','$timeout','$rootScope','$state','$location', function($q,mesentitlement,$timeout,$rootScope,$state, $location){
						return $q(function(resolve, reject) {
							$timeout(function() {
								if ($rootScope.isBaseSet2 && isSuperAdmin != 'true') {
									resolve(function () {
										var entitledStatesReturn = mesentitlement.stateDepResolver('threesixty');

										mesentitlementProvider.setStateCheck("threesixty");

										if(entitledStatesReturn !== true){
											return $q.reject("unauthorized");
										}
									});
								} else {
									return $location.path('/guide');
								}
							});
						});
					}]
                },
                bodyClass: 'threesixty'
            });

        // Navigation

        if(isSuperAdmin != 'true'){
            msNavigationServiceProvider.saveItem('threesixty', {
                title    : '360',
                state    : 'app.threesixty',
                weight   : 7
            });
        }

		$sceDelegateProvider.resourceUrlWhitelist([
			// Allow same origin resource loads.
			"self",
			// Allow loading from Google maps
			"http://azure.cloudcharge.com/services/reports**",

			"https://azure.cloudcharge.com/services/reports**",

			"http://app.cloudcharge.com/services/reports**",

			"https://app.cloudcharge.com/services/reports**",

			"https://cloudcharge.com/services/reports**",
			"http://ccresourcegrpdisks974.blob.core.windows.net/**",
			"https://ccresourcegrpdisks974.blob.core.windows.net/**"
		]);
    }

    function parseDateFilter(){
        return function(input){
            return new Date(input);
        };
    }

    function numberFixedLength(){
      return function (n, len) {
        var num = parseInt(n, 10);
        len = parseInt(len, 10);
        if (isNaN(num) || isNaN(len)) {
          return n;
        }
        num = ''+num;
        while (num.length < len) {
          num = '0'+num;
        }
        return num;
      };
    }
})();
