package infrastructure

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"sonantica-core/internal/plugins/domain"
)

// PluginClient implementa domain.IPluginClient
type PluginClient struct {
	internalSecret string
	httpClient     *http.Client
}

// NewPluginClient crea un nuevo cliente para plugins
func NewPluginClient(secret string) *PluginClient {
	return &PluginClient{
		internalSecret: secret,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *PluginClient) newRequest(ctx context.Context, method, url string, body interface{}) (*http.Request, error) {
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			return nil, err
		}
	}

	req, err := http.NewRequestWithContext(ctx, method, url, &buf)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Internal-Secret", c.internalSecret)

	return req, nil
}

func (c *PluginClient) GetManifest(ctx context.Context, baseURL string) (*domain.Manifest, error) {
	req, err := c.newRequest(ctx, http.MethodGet, baseURL+"/manifest", nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("plugin returned status %d", resp.StatusCode)
	}

	var manifest domain.Manifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return nil, err
	}

	return &manifest, nil
}

func (c *PluginClient) GetHealth(ctx context.Context, baseURL string) (*domain.HealthStatus, error) {
	req, err := c.newRequest(ctx, http.MethodGet, baseURL+"/health", nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("plugin returned status %d", resp.StatusCode)
	}

	var health domain.HealthStatus
	if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
		return nil, err
	}

	return &health, nil
}

func (c *PluginClient) CreateJob(ctx context.Context, baseURL string, trackID, filePath string, stems []string) (*domain.JobResponse, error) {
	payload := map[string]interface{}{
		"track_id":  trackID,
		"file_path": filePath,
		"stems":     stems,
	}

	req, err := c.newRequest(ctx, http.MethodPost, baseURL+"/jobs", payload)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to create job: status %d", resp.StatusCode)
	}

	var jobResp domain.JobResponse
	if err := json.NewDecoder(resp.Body).Decode(&jobResp); err != nil {
		return nil, err
	}

	return &jobResp, nil
}

func (c *PluginClient) GetJobStatus(ctx context.Context, baseURL string, jobID string) (*domain.JobResponse, error) {
	req, err := c.newRequest(ctx, http.MethodGet, baseURL+"/jobs/"+jobID, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status check failed: %d", resp.StatusCode)
	}

	var jobResp domain.JobResponse
	if err := json.NewDecoder(resp.Body).Decode(&jobResp); err != nil {
		return nil, err
	}

	return &jobResp, nil
}

func (c *PluginClient) CancelJob(ctx context.Context, baseURL string, jobID string) error {
	req, err := c.newRequest(ctx, http.MethodDelete, baseURL+"/jobs/"+jobID, nil)
	if err != nil {
		return err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("cancel failed: %d", resp.StatusCode)
	}

	return nil
}
