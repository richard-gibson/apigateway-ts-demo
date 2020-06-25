import { TodoService, TodoEntry } from "../src/todoService";
import { v4 as uuid } from 'uuid';
import { request } from "@hexlabs/apigateway-ts";
// import { consoleLoggingFilter, httpErrorFilter, request } from "@hexlabs/apigateway-ts";
import { TodoAPI } from "../src/todoApi";

describe('Todo demo', () => {
  let tododb: TodoEntry[] = [
    { id: "1", itemUrl: "http://ext.com/1", title: "brush teeth", itemOrder: 1, completed: false },
    { id: "2", itemUrl: "http://ext.com/2", title: "get dressed", itemOrder: 2, completed: false },
    { id: "3", itemUrl: "http://ext.com/3", title: "eat breakfast", itemOrder: 3, completed: false }
  ];

  const inMemTodoService: TodoService = {
    fetchAll: async () => tododb,
    fetch: async (id: string) => tododb.find(entry => entry.id && entry.id === id),
    save: async (id: string | undefined, todoEntry: TodoEntry) => {
      const persistedId = id ?? uuid();
      const persistedTodoEntry: TodoEntry = { ...todoEntry, id: persistedId };
      tododb.push(persistedTodoEntry);
      return persistedTodoEntry;
    },
    delete: async (id: string) => {
      const entry = tododb.find(entry => entry.id && entry.id === id);
      if (entry) {
        tododb = tododb.filter(entry => (!entry.id) || entry.id !== id);
        return entry;
      } else {
        return undefined;
      }
    }
  };

  const basePath = "/base";
  const filteredTodoAPI = new TodoAPI(
    inMemTodoService,
    basePath,
    []
  );
  it('should fetch all items', async () => {
    const res = await filteredTodoAPI.handle(request({
      httpMethod: "GET",
      resource: basePath,
    }));
    expect(res.statusCode).toEqual(200);
    expect(JSON.parse(res.body) as TodoEntry[]).toEqual(tododb);
  });

  it('should accept POST todo entry', async () => {
    const origTodoDb = [...tododb]
    const res = await filteredTodoAPI.handle(request({
      httpMethod: "POST",
      resource: basePath,
      body: JSON.stringify({ itemUrl: "http://ext.com/1", title: "brush teeth", itemOrder: 0, completed: false })
    }));
    expect(res.statusCode).toEqual(200);
    const createdTodo = JSON.parse(res.body) as TodoEntry;
    expect(tododb).toEqual([...origTodoDb, createdTodo])
  });

it('should accept DELETE todo entry', async () => {
  const deleteTodo: TodoEntry = { id: "000", itemUrl: "http://ext.com/3", title: "eat breakfast", itemOrder: 0, completed: false }
  const origTodoDb = [...tododb]
  tododb = [...tododb, deleteTodo]
  const res = await filteredTodoAPI.handle(request({
    httpMethod: "DELETE",
    resource: basePath+'/{id}',
    "pathParameters": {
      "id": "000"
  }
  }));
  expect(res.statusCode).toEqual(200);
  expect(tododb).toEqual(origTodoDb)
});
});
