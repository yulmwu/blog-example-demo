package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// MyCRDSpec defines the desired state of MyCRD
type MyCRDSpec struct {
	// 유지하고 싶은 파드 수 (Deployment replicas)
	// +optional
	Replicas *int32 `json:"replicas,omitempty"`

	// 컨테이너 이미지 (기본값: nginx:1.25.3)
	// +optional
	Image string `json:"image,omitempty"`
}

// MyCRDStatus defines the observed state of MyCRD
type MyCRDStatus struct {
	// 현재 가용(Ready) 파드 수
	// +optional
	AvailableReplicas int32 `json:"availableReplicas,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:resource:shortName=myc
// +kubebuilder:printcolumn:name="Desired",type=integer,JSONPath=`.spec.replicas`,description="Desired replicas",priority=0
// +kubebuilder:printcolumn:name="Available",type=integer,JSONPath=`.status.availableReplicas`,description="Available replicas",priority=0
// +kubebuilder:printcolumn:name="Image",type=string,JSONPath=`.spec.image`,description="Container image",priority=1
type MyCRD struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   MyCRDSpec   `json:"spec,omitempty"`
	Status MyCRDStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// MyCRDList contains a list of MyCRD
type MyCRDList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []MyCRD `json:"items"`
}

func init() {
	SchemeBuilder.Register(&MyCRD{}, &MyCRDList{})
}
