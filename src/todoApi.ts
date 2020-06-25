import { bind, Handler, HttpMethod, router, requiredPathParam, fromJson, Filter, withFilters, Api } from '@hexlabs/apigateway-ts';
import { TodoService, TodoEntry } from './todoService';

export class TodoAPI implements Api {
    readonly todoService: TodoService;
    readonly filters: Filter[];
    readonly handle: Handler;

    constructor(todoService: TodoService, basePath: string | undefined, filters: Filter[]) {
        this.todoService = todoService;
        this.filters = filters;
        this.handle = (basePath)
            ? router([bind(basePath, this.todoRouter())])
            : this.todoRouter();
    }

    todoRouter(): Handler {
        return withFilters(router([
            bind("/{id}", router([
                bind(HttpMethod.GET, async request => {
                    const id = requiredPathParam(request, "id");
                    const todoEntry = await this.todoService.fetch(id);
                    return (todoEntry)
                        ? { statusCode: 200, body: JSON.stringify(todoEntry) }
                        : { statusCode: 404, body: '' };
                }),
                bind(HttpMethod.PUT, async (request) => {
                    const id = requiredPathParam(request, "id");
                    const todoEntry: TodoEntry = fromJson(request);
                    await this.todoService.save(id, todoEntry);
                    return { statusCode: 201, body: JSON.stringify(todoEntry) };
                }),
                bind(HttpMethod.DELETE, async (request) => {
                    const id = requiredPathParam(request, "id");
                    const deletedTodo = await this.todoService.delete(id);
                    return (deletedTodo)
                        ? { statusCode: 200, body: JSON.stringify(deletedTodo) }
                        : { statusCode: 404, body: '' };
                })
            ])),
            bind(["/", HttpMethod.GET], async () => {
                const fetchResult = await this.todoService.fetchAll();
                return { statusCode: 200, body: JSON.stringify(fetchResult, null, 2) };
            }),
            bind(["/", HttpMethod.POST], async (request) => {
                const todoEntry: TodoEntry = fromJson(request);
                const saveResult = await this.todoService.save(undefined, todoEntry);
                return { statusCode: 200, body: JSON.stringify(saveResult, null, 2) };
            })

        ]), ...this.filters);
    }
}