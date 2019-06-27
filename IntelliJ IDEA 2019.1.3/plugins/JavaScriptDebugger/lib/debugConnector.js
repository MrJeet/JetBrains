try {
  if (hasInspectArg()) {
    return;
  }

  if (isElectronRendererProcess()) {
    return;
  }

  try {
    if (!require('worker_threads').isMainThread) {
      // will be attached using WIP NodeWorker domain
      return;
    }
  }
  catch (ignored) {
  }

  let inspector = require("inspector");

  let port = findAvailablePort(inspector);

  let fs = require("fs");
  let portsFile = process.env["JB_DEBUG_FILE"];
  fs.appendFileSync(portsFile, port + "\n")

  inspector.open(port, undefined, true);
}
catch (e) {
  console.error("Error in JetBrains node debug connector: ", e)
}

function hasInspectArg() {
  return process.execArgv.find(
      arg => arg === "--inspect" || arg === "--inspect-brk" || arg.startsWith("--inspect-brk=") || arg.startsWith("--inspect=")
  );
}

function isElectronRendererProcess() {
  return process.type && process.type == "renderer";
}

function findAvailablePort(inspector) {
  try {
    let closeAuxiliaryInspector = Boolean(process.env["JB_CLOSE_AUXILIARY_INSPECTOR"]);
    if (closeAuxiliaryInspector) {
      process.stderr.write("[IntelliJ is searching for port] ")
    }

    inspector.open(0, undefined, false);
    let url = inspector.url();
    let schemeSeparatorIndex = url.indexOf("://");
    let slashIndex = url.indexOf("/", schemeSeparatorIndex + 3);
    let colonIndex = url.substr(0, slashIndex).lastIndexOf(":");
    let portString = url.substr(colonIndex + 1, slashIndex - colonIndex - 1);
    let port = Number(portString);
    if (!port) throw Error("failed to parse " + url);

    if (closeAuxiliaryInspector) {
      inspector.close()
    }

    return port;
  }
  catch(e) {
    inspector.close();
    throw e;
  }
}