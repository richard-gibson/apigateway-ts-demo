import io.hexlabs.kloudformation.module.serverless.Method
import io.hexlabs.kloudformation.module.serverless.serverless
import io.kloudformation.KloudFormation
import io.kloudformation.StackBuilder
import io.kloudformation.Value
import io.kloudformation.function.plus
import io.kloudformation.json
import io.kloudformation.model.Output
import io.kloudformation.model.iam.actions
import io.kloudformation.model.iam.policyDocument
import io.kloudformation.model.iam.resources
import io.kloudformation.property.aws.dynamodb.table.AttributeDefinition
import io.kloudformation.property.aws.dynamodb.table.GlobalSecondaryIndex
import io.kloudformation.property.aws.dynamodb.table.KeySchema
import io.kloudformation.property.aws.dynamodb.table.globalSecondaryIndex
import io.kloudformation.property.aws.dynamodb.table.projection
import io.kloudformation.property.aws.iam.role.Policy
import io.kloudformation.resource.aws.dynamodb.table
import io.kloudformation.resource.aws.iam.Role
import io.kloudformation.resource.aws.sns.topic
import io.kloudformation.unaryPlus
import java.lang.IllegalArgumentException

class Stack : StackBuilder {

    override fun KloudFormation.create(args: List<String>) {
        val api = "dev.api.klouds.io"

        val todoTable = table(listOf(
                KeySchema(+"id", keyType = +"HASH")
        )) {
            tableName("demo-todo")
            attributeDefinitions(listOf(
                    AttributeDefinition(+"id", +"S")
            ))
            billingMode("PAY_PER_REQUEST")
        }

        serverless("apigateway-ts-demo", "dev", +"hexlabs-deployments") {
            serverlessFunction("api", +args.first(), +"bundle.handler", +"nodejs12.x") {
                lambdaRole { policies(policies.orEmpty() + policyForTables(listOf(todoTable.Arn()))) }
                lambdaFunction {
                    functionName("demo-todo")
                    memorySize(512)
                    timeout(30)
                    environment {
                        variables(json(mapOf(
                                "BASE_PATH" to "/todo",
                                "TODO_TABLE" to todoTable.ref()
                        )))
                    }
                }
                http(cors = false) {
                    httpBasePathMapping(+api, +"demo-todo")
                    path("todo") {
                        Method.GET()
                        Method.POST()
                        path("{id}") {
                            Method.GET()
                            Method.PUT()
                            Method.DELETE()
                        }
                    }
                }
            }
        }
    }

    private fun policyForTables(tables: List<Value<String>>) = Policy(
            policyName = +"TableAccess",
            policyDocument = policyDocument {
                statement(actions("dynamodb:*"), resource = resources(*tables.toTypedArray()))
            }
    )
}