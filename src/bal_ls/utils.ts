import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { LanguageName, SCHEME } from "./models";
import { BASE_DIR, BASE_DIR_1 } from "../file_system/fsRoutes";
import * as path from "path";
import os from "os";
import { exec } from 'child_process';
import { Message } from "vscode-ws-jsonrpc";
import { InitializeParams, InitializeRequest, RegistrationParams, RegistrationRequest, RequestMessage, ResponseMessage } from "vscode-languageserver-protocol";
import { URI } from "vscode-uri";

export const COMMAND_NOT_FOUND = "command not found";
export const NO_SUCH_FILE = "No such file or directory";
export const ERROR = "Error:";

export interface BallerinaHome {
  userHome: string,
  ballerinaHome: string,
  distPath: string,
  ballerinaCmd: string,
  ballerinaVersionText: string,
  ballerinaVersion: string
}

export const getLocalDirectory = (referenceUrl: string | URL) => {
  const __filename = fileURLToPath(referenceUrl);
  return dirname(__filename);
};

// windows fix
// export const resolvePath = (message: string) => {
//   if (message.includes(`${SCHEME}:`)) { // messages from client
//     message = message.replace(new RegExp(`${SCHEME}:`, 'g'), `file:///${BASE_DIR}`);
//   }
//   else if (message.includes(`${BASE_DIR}`) || message.includes("bala:/") || message.includes("file:/")) { // messages from lang server
//     message = message.replace(new RegExp("bala:/", 'g'), "bala://");
//     message = message.replace(new RegExp(`file:///${BASE_DIR}`, 'g'), `${SCHEME}:`);
//     message = message.replace(new RegExp(`file:///`, 'g'), `bala://`);
//     message = message.replace(new RegExp(`${BASE_DIR}`, 'g'), "");
//   }
//   return JSON.parse(message);
// }

// linux fix
// export const resolvePath = (message: string) => {
//   if (message.includes(`${SCHEME}:`)) { // messages from client
//     message = message.replace(new RegExp(`${SCHEME}:`, 'g'), `file://${BASE_DIR}`);
//   }
//   else if (message.includes(`${BASE_DIR}`)) { // messages from lang server
//     message = message.replace(new RegExp(`file://${BASE_DIR}`, 'g'), `${SCHEME}:`);
//     message = message.replace(new RegExp(`${BASE_DIR}`, 'g'), "");
//   }
//   return JSON.parse(message);
// }

export const resolveAbsolutePath = (message: string) => {
  const fileScheme = os.platform() === "win32" ? "file:///" : "file://";
  
  if (message.includes(`${SCHEME}:`)) { // messages from client
    message = message.replace(new RegExp(`${SCHEME}:`, 'g'), `${fileScheme}${BASE_DIR}`);
  } else if (message.includes(`${BASE_DIR}`) || 
             message.includes("bala:/") || 
             message.includes("file:/")) { // messages from lang server
    message = os.platform() === "win32" ? message.replace(new RegExp("bala:/", 'g'), "bala://") : message;
    message = message.replace(new RegExp(`${fileScheme}${BASE_DIR}`, 'g'), `${SCHEME}:`);
    message = message.replace(new RegExp(`${fileScheme}${BASE_DIR_1}`, 'g'), `${SCHEME}:`);
    message = os.platform() === "win32" ? message.replace(new RegExp(`${fileScheme}`, 'g'), `bala://`) : message;
    message = message.replace(new RegExp(`${BASE_DIR}`, 'g'), "");
    message = message.replace(new RegExp(`${BASE_DIR_1}`, 'g'), `${SCHEME}:`);
  }
  return JSON.parse(message);
}

export function resolveRequestPath(message: RequestMessage) {
  if (message.method === InitializeRequest.type.method) {
    const initializeParams = message.params as InitializeParams;
    initializeParams.processId = process.pid;
  } else if (message.method === RegistrationRequest.method) {
    const registrationParams = message.params as RegistrationParams;
    if (registrationParams.registrations.length > 0) {
      registrationParams.registrations[0].registerOptions
        .documentSelector.push({ language: LanguageName.ballerina, scheme: `${SCHEME}` })
    }
  } else if (message.method === "typesManager/getTypes" || message.method === "typesManager/updateType"
    || message.method === "jsonToRecordTypes/convert" || message.method === "xmlToRecordTypes/convert"
    || message.method === "serviceDesign/getServiceFromSource" || message.method === "serviceDesign/updateFunction"
    || message.method === "serviceDesign/addResource" || message.method === "expressionEditor/types"
    || message.method === "serviceDesign/getListenerFromSource" || message.method === "serviceDesign/updateListener"
    || message.method === "bi-diagram/getVisibleVariableTypes" || message.method === "serviceDesign/updateService"
    || message.method === "expressionEditor/visibleVariableTypes" || message.method === "flowDesignService/getNodeTemplate"
    || message.method === "flowDesignService/getSourceCode" || message.method === "serviceDesign/getListeners"
    || message.method === "serviceDesign/getServiceModel" || message.method === "serviceDesign/addListener"
    || message.method === "typesManager/updateTypes" || message.method === "flowDesignService/deleteFlowNode"
    || message.method === "typesManager/createGraphqlClassType" || message.method === "typesManager/getGraphqlType"
    || message.method === "serviceDesign/addFunction"
  ) {
    if (message.params && "filePath" in message.params && message.params.filePath) {
      const inputPath = message.params.filePath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      console.log("parse: ", URI.parse(inputPath))
      console.log("fixedPath: ", fixedPath)
      message.params.filePath = fixedPath;

    }
    else if (message.params && "filePathUri" in message.params && message.params.filePathUri) {
      const inputPath = message.params.filePathUri as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      console.log("parse: ", URI.parse(inputPath))
      console.log("fixedPath: ", fixedPath)
      message.params.filePathUri = fixedPath;
    }
  } else if ((message.method === "designModelService/getDesignModel"
    || message.method === "configEditor/getConfigVariables") 
    && message.params && "projectPath" in message.params && message.params.projectPath
  ) {
      const inputPath = message.params.projectPath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      console.log("parse: ", URI.parse(inputPath))
      console.log("fixedPath: ", fixedPath)
      message.params.projectPath = fixedPath;
  } else if (message.method === "configEditor/updateConfigVariables" && message.params && "configFilePath" in message.params && message.params.configFilePath) {
      const inputPath = message.params.configFilePath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      console.log("parse: ", URI.parse(inputPath))
      console.log("fixedPath: ", fixedPath)
      message.params.configFilePath = fixedPath;
  } else if (message.method === "serviceDesign/addService") {
    if (message.params && "filePath" in message.params && message.params.filePath) {
      const inputPath = message.params.filePath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      message.params.filePath = fixedPath;
    }
    if (message.params && "service" in message.params
      && typeof message.params.service === "object" && message.params.service &&
      "properties" in message.params.service && typeof message.params.service.properties === "object" && message.params.service.properties
      && "designApproach" in message.params.service.properties && typeof message.params.service.properties.designApproach === "object" && message.params.service.properties.designApproach
      && "choices" in message.params.service.properties.designApproach && Array.isArray(message.params.service.properties.designApproach.choices) && message.params.service.properties.designApproach.choices
    ) {
      const choices = message.params.service.properties.designApproach.choices as any[];
      const specUri = choices[1].properties.spec.value as string;
      if (specUri) {
        const fixedPath = URI.parse(specUri).path.substring(1);
        message.params.service.properties.designApproach.choices[1].properties.spec.value = fixedPath;
      }
    }
  } else if (message.method === "openAPILSExtension/generateOpenAPI") {
    if (message.params && "documentFilePath" in message.params && message.params.documentFilePath) {
      const inputPath = message.params.documentFilePath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      message.params.documentFilePath = fixedPath;
      console.log("parse: ", URI.parse(inputPath))
      console.log("fixedPath: ", fixedPath)
    }
  } else if (message.method === "flowDesignService/functionDefinition") {
    if (message.params && "fileName" in message.params && message.params.fileName) {
      const inputPath = message.params.fileName as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      message.params.fileName = fixedPath;
    }
    if (message.params && "projectPath" in message.params && message.params.projectPath) {
      const inputPath = message.params.projectPath as string;
      const fixedPath = URI.parse(inputPath).path.substring(1);
      message.params.projectPath = fixedPath;
    }
  }
  return message;
}

export function resolveResponseMessage(message: ResponseMessage) {
  if (message.result
    && typeof message.result === "object"
    && "designModel" in message.result &&
    message.result.designModel
  ) {
    const { connections, listeners, services } = message.result.designModel as { connections: any[], listeners: any[], services: any[] }
    connections.forEach(conn => {
      const oldFilePath = conn.location.filePath as string;
      let fixedPath = oldFilePath.replace(/\\/g, "/").replace(BASE_DIR, "");
      fixedPath = `${SCHEME}:${fixedPath}`
      conn.location.filePath = fixedPath;
      console.log({ "old": oldFilePath, "fix": fixedPath })
    });
    listeners.forEach(listener => {
      const oldFilePath = listener.location.filePath as string;
      let fixedPath = oldFilePath.replace(/\\/g, "/").replace(BASE_DIR, "")
      fixedPath = `${SCHEME}:${fixedPath}`
      listener.location.filePath = fixedPath;
      console.log({ "old": oldFilePath, "fix": fixedPath })
    });
    services.forEach(service => {
      const oldFilePath = service.location.filePath as string;
      let fixedPath = oldFilePath.replace(/\\/g, "/").replace(BASE_DIR, "")
      fixedPath = `${SCHEME}:${fixedPath}`
      service.location.filePath = fixedPath;
      console.log({ "old": oldFilePath, "fix": fixedPath })
    });
  } 

  return message;
}

export function getBallerinaHome(): Promise<BallerinaHome | undefined> {
  return new Promise((resolve, reject) => {
    const userHome = os.homedir();
    const ballerinaUserHomeName = '.ballerina';
    const ballerinaUserHome = path.join(userHome, ballerinaUserHomeName);
    const ballerinaHomeCustomDirName = "ballerina-home";
    const ballerinaHome = path.join(ballerinaUserHome, ballerinaHomeCustomDirName);
    const distPath = path.join(ballerinaHome, "bin") + path.sep;
    const ballerinaExecutor = 'bal';
    let exeExtension = "";
    if (os.platform() === "win32") {
      exeExtension = ".bat";
    }
    const ballerinaCmd = (distPath + ballerinaExecutor + exeExtension).trim();

    exec(`${ballerinaCmd} version`, (err, stdout, stderr) => {
      if (stdout) console.log(`bal command stdout: ${stdout}`);
      if (stderr) console.log(`bal command stderr: ${stderr}`);
      if (err || stdout.toLocaleLowerCase().includes("error")) {
        console.error(`bal command error: ${err}`);
        return reject(stdout);
      }

      try {
        const implVersionLine = stdout.split('\n')[0]; // e.g. Ballerina 2201.11.0
        const replacePrefix = implVersionLine.startsWith("jBallerina") ? /jBallerina / : /Ballerina /;
        const parsedVersion = implVersionLine.replace(replacePrefix, '').trim();

        resolve({
          userHome: userHome,
          ballerinaHome: ballerinaHome,
          distPath: distPath,
          ballerinaCmd: ballerinaCmd,
          ballerinaVersionText: parsedVersion,
          ballerinaVersion: parsedVersion.split(" ")[0]
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  });
}
