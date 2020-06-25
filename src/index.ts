import {TodoAPI} from './todoApi'
import { DDBTodoService } from './todoService';
import { consoleLoggingFilter, httpErrorFilter } from '@hexlabs/apigateway-ts';
import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const environment: {
    BASE_PATH: string;
    TODO_TABLE: string;
  } = process.env as any;

const todoService = new DDBTodoService(environment.TODO_TABLE);
const filteredTodoAPI = new TodoAPI(
    todoService, 
    environment.BASE_PATH,
    [consoleLoggingFilter, 
    httpErrorFilter]
    )

export const handler: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = 
  async event => await filteredTodoAPI.handle(event)

