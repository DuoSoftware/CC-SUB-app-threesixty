////////////////////////////////
// App : 360
// Owner  : Gihan Herath
// Last changed date : 2017/08/02
// Version : 6.1.0.11
// Modified By : Kasun
/////////////////////////////////

(function ()
{
    'use strict';

    angular
        .module('app.threesixty', [])
        .config(config)
        .filter('parseDate',parseDateFilter)
        .filter('numberFixedLen',numberFixedLength);

    /** @ngInject */
    function config($stateProvider, msNavigationServiceProvider, mesentitlementProvider)
    {

        mesentitlementProvider.setStateCheck("threesixty");

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
								$rootScope.isBaseSet2 = true;
								if ($rootScope.isBaseSet2) {
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

        msNavigationServiceProvider.saveItem('threesixty', {
            title    : '360',
            state    : 'app.threesixty',
            weight   : 7
        });
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
