function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
document.addEventListener("DOMContentLoaded", function(event) { 
  function shuffle(o){
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
  } 
  Array.prototype.getUnique = function(){
     var u = {}, a = [];
     for(var i = 0, l = this.length; i < l; ++i){
        if(u.hasOwnProperty(this[i])) {
           continue;
        }
        a.push(this[i]);
        u[this[i]] = 1;
     }
     return a;
  }

  String.prototype.hashCode = function() {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
      chr   = this.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  };
  function rot13(s, amnt) {
    amnt = amnt || 13;
    return s.replace(/[a-zA-Z]/g,function(c){return String.fromCharCode((c<="Z"?90:122)>=(c=c.charCodeAt(0)+amnt)?c:c-26);});
  }
  shuffle(randomNames);

  var curIndex = 0;
  var schoolType = ['Middle', 'High', 'Elementary'];

  var sites = {};
  var newSiteIdMapping = {};
  var newNetworkIdMapping = {};
  var newInstanceIdMapping = {};
  var networks = {};
  var instances = {};
  var schoolId = 1;
  var randomOffset = getRandomInt(1, 10000);
  allSchools.forEach(function(school) {
    school.ID = schoolId++;
    school.SchoolName = randomNames[curIndex++].surname + ' ' + schoolType[getRandomInt(0, schoolType.length - 1)] + ' School';
    var oldSiteId = school.SiteID;
    if (!newSiteIdMapping[oldSiteId]) {
      var newSiteName = randomNames[curIndex++].surname + ' County Schools';
      newSiteIdMapping[oldSiteId] = {newId: oldSiteId + randomOffset, newName: newSiteName};
    }
    school.SiteID = newSiteIdMapping[oldSiteId].newId;
    school.SiteName = newSiteIdMapping[oldSiteId].newName;
    school.Networks.forEach(function(network) {
      var oldNetworkId = network.id;
      if (!newNetworkIdMapping[oldNetworkId]) {
        newNetworkIdMapping[oldNetworkId] = {newId: oldNetworkId + randomOffset, newName: 'Network ' + (oldNetworkId + randomOffset)};
      }
      network.id += newNetworkIdMapping[oldNetworkId].newId;
      network.networkName = newNetworkIdMapping[oldNetworkId].newName; 
    });
    school.Instances.forEach(function(instance) {
      var oldInstanceId = instance.id;
      if (!newInstanceIdMapping[oldInstanceId]) {
        var amnt = getRandomInt(1, 25);
        var newName = instance.instanceName.indexOf(' ') > -1 ?
          rot13(instance.instanceName.split(' ')[0], amnt) + ' ' + instance.instanceName.split(' ')[1] :
          rot13(instance.instanceName, amnt);

        newInstanceIdMapping[oldInstanceId] = {
          newId: oldInstanceId + randomOffset,
          newName: newName
        };
      }
      instance.id += newInstanceIdMapping[oldInstanceId].newId;
      instance.instanceName = newInstanceIdMapping[oldInstanceId].newName; 
    });
  });
  var jsonDump = document.getElementById("jsondump");
  if (jsonDump) jsonDump.value = JSON.stringify(allSchools);
});
