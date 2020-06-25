import { DynamoDB } from "aws-sdk";
import { v4 as uuid } from 'uuid';

export type TodoEntry = {
    id?: string;
    itemUrl?: string;
    title: string;
    itemOrder: number;
    completed: boolean;
};

export interface TodoService {
    fetchAll(): Promise<TodoEntry[]>;
    fetch(id: string): Promise<TodoEntry | undefined>;
    save(id: string | undefined, todoEntry: TodoEntry): Promise<TodoEntry>;
    delete(id: string): Promise<TodoEntry | undefined>;
}

function projectionOf<T>(...keys: (keyof T)[]): string {
    return keys.join(", ");
}

export class DDBTodoService implements TodoService {
    readonly tableName: string;
    readonly dynamoClient: DynamoDB.DocumentClient;
    readonly todoProjection = projectionOf<TodoEntry>("id", "itemUrl", "title", "itemOrder");

    constructor(tableName: string, dynamoClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient()) {
        this.tableName = tableName;
        this.dynamoClient = dynamoClient;
    }
    async fetchAll(): Promise<TodoEntry[]> {
        const res = await this.dynamoClient.scan({
            TableName: this.tableName,
            ProjectionExpression: this.todoProjection
        }).promise();
        return res.Items?.map(item => item as TodoEntry) ?? [];
    }
    async fetch(id: string): Promise<TodoEntry | undefined> {
        const res = await this.dynamoClient.get({
            TableName: this.tableName,
            Key: { id },
            ProjectionExpression: this.todoProjection
        }).promise();
        const item = res?.Item;
        return (item)
            ? item as TodoEntry
            : undefined;
    }
    async save(id: string | undefined, todoEntry: TodoEntry): Promise<TodoEntry> {
        const persistedId = id ?? uuid();
        const persistedTodoEntry: TodoEntry = { ...todoEntry, id: persistedId };
        await this.dynamoClient.put({
            TableName: this.tableName,
            Item: persistedTodoEntry
        }).promise();
        return persistedTodoEntry;
    }
    async delete(id: string): Promise<TodoEntry | undefined> {
        const res = await this.dynamoClient.delete({
            TableName: this.tableName,
            Key: { id },
            ReturnValues: 'ALL_OLD'
        }).promise();
        const item = res?.Attributes
        return (item)
            ? item as TodoEntry
            : undefined;
    }




}