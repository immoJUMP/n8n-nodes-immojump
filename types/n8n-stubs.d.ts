// Minimal stubs to compile without installing n8n packages locally.
// At runtime, n8n provides these modules.

declare module 'n8n-workflow' {
  export type ICredentialType = any;
  export type INodeProperties = any;
  export type INodeExecutionData = any;
  export class NodeApiError extends Error {}
  export class NodeOperationError extends Error {}
  export interface INodeType {}
  export interface INodeTypeDescription {}
}

declare module 'n8n-core' {
  export interface IExecuteFunctions {
    getInputData(): any[];
    getNodeParameter(name: string, itemIndex: number): any;
    getCredentials(name: string): Promise<any>;
    helpers: {
      request(opts: any): Promise<any>;
    };
  }
  export interface IHookFunctions {
    getCredentials(name: string): Promise<any>;
    getNodeParameter(name: string, itemIndex?: number): any;
    getWorkflowStaticData(scope: 'node' | 'global'): any;
    getNodeWebhookUrl(name: string): string;
    helpers: {
      request(opts: any): Promise<any>;
    };
  }
  export interface IWebhookFunctions {
    getBodyData(): any;
  }
}
