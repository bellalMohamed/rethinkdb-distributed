function myFunction(numberOfElements, cpuMemoryPerSlave) {
   var mx = Math.max(...cpuMemoryPerSlave);
   var arrayLength = cpuMemoryPerSlave.length;
   var sum = 0;

    for (var i = 0; i < arrayLength; i++)
    {
        cpuMemoryPerSlave[i] /= mx;
        sum += cpuMemoryPerSlave[i];
    }

    sum = Math.ceil(sum);

    var patch  = Math.floor(numberOfElements / sum);

    var lastIndex = 0;
    indexArr = [];
    for (var i = 0; i < arrayLength - 1; i++)
    {
        var holder  = Math.round (patch * cpuMemoryPerSlave[i]);
        indexArr.push([lastIndex , lastIndex + holder]);
        lastIndex = lastIndex + holder + 1 ;
    }

    indexArr.push([lastIndex ,  numberOfElements - 1]);
    return indexArr ;
  }