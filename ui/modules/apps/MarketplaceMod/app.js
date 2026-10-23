angular.module('beamng.apps')
.directive('marketplaceModApp', [function () {
  return {
    template:
      '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;' +
      'background:#ff6600;color:var(--bng-off-white,#ebebeb);font-family:var(--fnt-defs,\'Noto Sans\'),sans-serif;font-weight:700;' +
      'letter-spacing:.02em;cursor:pointer;border-radius:var(--bng-corners-1,.25rem);" ' +
      'ng-click="openMarketplace()">MARKETPLACE</div>',
    replace: true,
    restrict: 'EA',
    link: function (scope) {
      scope.openMarketplace = function () {
        if (window.MarketplaceModMarket) window.MarketplaceModMarket.open()
        else bngApi.engineLua('extensions.load("marketplaceMod"); extensions.marketplaceMod.toggle()')
      }
    }
  }
}])
