/**
 *
 * Run blocks - get executed after the injector is created and are used to kickstart the application.
 * Only instances and constants can be injected into run blocks. This is to prevent further
 * system configuration during application run time.
 *
 */

(function () {
    'use strict';

    angular.module('iot').run(runBlock);

    /** @ngInject */
    function runBlock($log) {
        $log.debug('IoT app started.');
    }


})();
