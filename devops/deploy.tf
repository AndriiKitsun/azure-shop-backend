# Configure the Azure provider
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.92.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

# Product Service

resource "azurerm_resource_group" "product_service_rg" {
  location = "northeurope"
  name     = "rg-product-service-sand-ne-001"
}

resource "azurerm_storage_account" "products_service_fa" {
  name     = "stgsangproductsfaneak001"
  location = "northeurope"

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"

  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_storage_share" "products_service_fa" {
  name  = "fa-products-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.products_service_fa.name
}

resource "azurerm_service_plan" "product_service_plan" {
  name     = "asp-product-service-sand-ne-001"
  location = "northeurope"

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_application_insights" "products_service_fa" {
  name             = "appins-fa-products-service-sand-ne-001"
  application_type = "web"
  location         = "northeurope"


  resource_group_name = azurerm_resource_group.product_service_rg.name
}


resource "azurerm_windows_function_app" "products_service" {
  name     = "fa-products-service-ne-ak001"
  location = "northeurope"

  service_plan_id     = azurerm_service_plan.product_service_plan.id
  resource_group_name = azurerm_resource_group.product_service_rg.name

  storage_account_name       = azurerm_storage_account.products_service_fa.name
  storage_account_access_key = azurerm_storage_account.products_service_fa.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key = azurerm_application_insights.products_service_fa.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.products_service_fa.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      support_credentials = true
      allowed_origins     = [
        "https://portal.azure.com",
        "http://localhost:4200",
        "https://stgsandfrontendneak001.z16.web.core.windows.net"
      ]
    }

    application_stack {
      node_version = "~16"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.products_service_fa.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.products_service_fa.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

resource "azurerm_app_configuration" "products_config" {
  location            = "northeurope"
  name                = "appconfig-products-service-sand-neak-001"
  resource_group_name = azurerm_resource_group.product_service_rg.name

  sku = "free"
}

resource "azurerm_cosmosdb_account" "test_app" {
  location            = "northeurope"
  name                = "cos-app-sand-neak-001"
  offer_type          = "Standard"
  resource_group_name = azurerm_resource_group.product_service_rg.name
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Eventual"
  }

  capabilities {
    name = "EnableServerless"
  }

  geo_location {
    failover_priority = 0
    location          = "North Europe"
  }
}

resource "azurerm_cosmosdb_sql_database" "products_app" {
  account_name        = azurerm_cosmosdb_account.test_app.name
  name                = "products-db"
  resource_group_name = azurerm_resource_group.product_service_rg.name
}


resource "azurerm_cosmosdb_sql_container" "products" {
  account_name       = azurerm_cosmosdb_account.test_app.name
  database_name      = azurerm_cosmosdb_sql_database.products_app.name
  name               = "products"
  partition_key_path = "/id"
  resource_group_name = azurerm_resource_group.product_service_rg.name

  # Cosmos DB supports TTL for the records
  default_ttl = -1

  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "stocks" {
  account_name       = azurerm_cosmosdb_account.test_app.name
  database_name      = azurerm_cosmosdb_sql_database.products_app.name
  name               = "stocks"
  partition_key_path = "/product_id"
  resource_group_name = azurerm_resource_group.product_service_rg.name

  # Cosmos DB supports TTL for the records
  default_ttl = -1

  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}

# Import service

resource "azurerm_resource_group" "import_service_rg" {
  location = "northeurope"
  name     = "rg-import-service-sand-ne-001"
}

resource "azurerm_storage_account" "import_service_fa" {
  name     = "stgsangimportfaneak001"
  location = "northeurope"

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 0
    }
  }

  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_storage_share" "import_service_fa" {
  name  = "fa-import-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.import_service_fa.name
}

resource "azurerm_storage_container" "import_service_uploaded_container" {
  name                  = "uploaded"
  storage_account_name  = azurerm_storage_account.import_service_fa.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "import_service_parsed_container" {
  name                  = "parsed"
  storage_account_name  = azurerm_storage_account.import_service_fa.name
  container_access_type = "private"
}

resource "azurerm_service_plan" "import_service_plan" {
  name     = "asp-import-service-sand-ne-001"
  location = "northeurope"

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_application_insights" "import_service_fa" {
  name             = "appins-fa-import-service-sand-ne-001"
  application_type = "web"
  location         = "northeurope"


  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_windows_function_app" "import_service" {
  name     = "fa-import-service-ne-ak001"
  location = "northeurope"

  service_plan_id     = azurerm_service_plan.import_service_plan.id
  resource_group_name = azurerm_resource_group.import_service_rg.name

  storage_account_name       = azurerm_storage_account.import_service_fa.name
  storage_account_access_key = azurerm_storage_account.import_service_fa.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key = azurerm_application_insights.import_service_fa.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.import_service_fa.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      support_credentials = true
      allowed_origins     = [
        "https://portal.azure.com",
        "http://localhost:4200",
        "https://stgsandfrontendneak001.z16.web.core.windows.net"
      ]
    }

    application_stack {
      node_version = "~18"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.import_service_fa.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.import_service_fa.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

// Service Bus

resource "azurerm_resource_group" "landing_zone_rg" {
  location = "northeurope"
  name     = "rg-landing-zone-sand-ne-001"
}

resource "azurerm_servicebus_namespace" "integration_sb" {
  name                          = "sb-integration-sand-neak-001"
  location                      = azurerm_resource_group.landing_zone_rg.location
  resource_group_name           = azurerm_resource_group.landing_zone_rg.name
  sku                           = "Basic"
  capacity                      = 0
  public_network_access_enabled = true
  minimum_tls_version           = "1.2"
  zone_redundant                = false
}

resource "azurerm_servicebus_queue" "products-import-queue" {
  name                                    = "sbq-products-import-sand-ne-001"
  namespace_id                            = azurerm_servicebus_namespace.integration_sb.id
  status                                  = "Active"
  enable_partitioning                     = true
  lock_duration                           = "PT1M"
  max_size_in_megabytes                   = 1024
  max_delivery_count                      = 10
  requires_duplicate_detection            = false
  duplicate_detection_history_time_window = "PT10M"
  requires_session                        = false
  dead_lettering_on_message_expiration    = false
}

// Docker App

resource "azurerm_resource_group" "docker_rg" {
  location = "northeurope"
  name     = "rg-docker-app-sand-ne-001"
}

resource "azurerm_log_analytics_workspace" "docker_log_analytics_workspace" {
  name                = "law-docker-app-log-analytics-ne-001"
  location            = azurerm_resource_group.docker_rg.location
  resource_group_name = azurerm_resource_group.docker_rg.name
}

resource "azurerm_container_registry" "docker_acr" {
  name                = "acrdockerappne001"
  resource_group_name = azurerm_resource_group.docker_rg.name
  location            = azurerm_resource_group.docker_rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_container_app_environment" "docker_cae" {
  name                       = "cae-docker-app-ne-001"
  location                   = azurerm_resource_group.docker_rg.location
  resource_group_name        = azurerm_resource_group.docker_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.docker_log_analytics_workspace.id
}

resource "azurerm_container_app" "docker_docker_hub" {
  name                         = "ca-dh-docker-app-ne-001"
  container_app_environment_id = azurerm_container_app_environment.docker_cae.id
  resource_group_name          = azurerm_resource_group.docker_rg.name
  revision_mode                = "Single"

  registry {
    server               = "docker.io"
    username             = "marlokis"
    password_secret_name = "docker-io-pass"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "docker-app"
      image  = "marlokis/docker-app-repo:v4"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Docker Hub"
      }
    }
  }

  secret {
    name  = "docker-io-pass"
    value = var.docker_hub_password
  }
}

resource "azurerm_container_app" "docker_ca_docker_acr" {
  name                         = "ca-acr-docker-app-ne-001"
  container_app_environment_id = azurerm_container_app_environment.docker_cae.id
  resource_group_name          = azurerm_resource_group.docker_rg.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.docker_acr.login_server
    username             = azurerm_container_registry.docker_acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    container {
      name   = "docker-app"
      image  = "${azurerm_container_registry.docker_acr.login_server}/docker-app:v1"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Azure Container Registry"
      }
    }
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.docker_acr.admin_password
  }
}
