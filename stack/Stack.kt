import io.hexlabs.kloudformation.module.serverless.serverless
import io.kloudformation.KloudFormation
import io.kloudformation.StackBuilder
import io.kloudformation.unaryPlus

class Stack: StackBuilder {
    override fun KloudFormation.create(args: List<String>) {
        val environment = System.getenv("ENVIRONMENT") ?: "dev"
        serverless("typescript-lambda-template", environment, +"hexlabs-deployments") {
            serverlessFunction("lambda", +args.first(), +"bundle.handler", +"nodejs12.x")
        }
    }
}
