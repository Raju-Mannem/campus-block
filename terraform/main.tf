provider "aws" {
  region = var.aws_region
}

resource "aws_iam_role" "lambda_exec_role" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "main" {
  function_name = "my-lambda"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.lambda_exec_role.arn

  s3_bucket     = var.lambda_s3_bucket
  s3_key        = var.lambda_s3_key
  source_code_hash = var.lambda_source_code_hash

  memory_size = 256
  timeout     = 15

  environment {
    variables = {
      MONGODB_URI         = var.mongodb_uri
      S3_BUCKET_NAME      = var.s3_bucket_name
      CLOUDFRONT_DOMAIN   = var.cloudfront_domain
      RAZORPAY_KEY_ID     = var.razorpay_key_id
      RAZORPAY_KEY_SECRET = var.razorpay_key_secret
      NODE_ENV            = "production"
    }
  }
}

resource "aws_apigatewayv2_api" "api" {
  name          = "campus-block-api"
  protocol_type = "HTTP"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.main.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "proxy" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
  depends_on  = [aws_apigatewayv2_route.proxy]
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.main.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
